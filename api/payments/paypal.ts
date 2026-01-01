import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getPaymentSettings } from '../lib/settings';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, sandboxMode: boolean): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const baseUrl = sandboxMode ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  switch (action) {
    case 'create-order':
      return createOrder(req, res);
    case 'capture-order':
      return captureOrder(req, res);
    default:
      return createOrder(req, res);
  }
}

async function createOrder(req: VercelRequest, res: VercelResponse) {
  try {
    // Get payment settings from database
    const settings = await getPaymentSettings();

    // Check if PayPal is enabled
    if (!settings.paypal.enabled) {
      return res.status(400).json({ error: 'PayPal payments are not enabled' });
    }

    // Check if PayPal is configured
    if (!settings.paypal.clientId || !settings.paypal.clientSecret) {
      return res.status(500).json({ error: 'PayPal is not configured' });
    }

    const PAYPAL_BASE_URL = settings.paypal.sandboxMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    // Verify auth
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { contestId } = req.body;

    if (!contestId) {
      return res.status(400).json({ error: 'Contest ID is required' });
    }

    // Fetch the contest
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: { client: true },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Verify the user is the contest owner
    if (contest.clientId !== payload.userId) {
      return res.status(403).json({ error: 'Only the contest owner can pay' });
    }

    // Check if contest is in correct status for payment
    if (contest.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Contest is not pending payment' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        contestId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this contest' });
    }

    // Calculate platform fee using settings
    const feePercent = settings.platformFeePercent / 100;
    const platformFee = (contest.budget * feePercent).toFixed(2);

    const accessToken = await getPayPalAccessToken(
      settings.paypal.clientId,
      settings.paypal.clientSecret,
      settings.paypal.sandboxMode
    );

    // Create PayPal order with Pay Later option enabled
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `contest-${contestId}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: contestId,
            description: `Pubblicazione concorso: ${contest.title}`,
            amount: {
              currency_code: 'EUR',
              value: platformFee,
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'ProjContest',
              locale: 'it-IT',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/api/payments/paypal?action=capture-order`,
              cancel_url: `${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/dashboard?payment=cancelled&contestId=${contestId}`,
            },
          },
        },
        application_context: {
          // Enable Pay in 3 (Pay Later)
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation error:', orderData);
      return res.status(500).json({ error: 'Failed to create PayPal order' });
    }

    // Create pending payment record
    await prisma.payment.create({
      data: {
        amount: parseFloat(platformFee),
        currency: 'EUR',
        status: 'PENDING',
        provider: 'PAYPAL',
        providerOrderId: orderData.id,
        contestId,
        userId: payload.userId,
        metadata: {
          paypalOrderId: orderData.id,
        },
      },
    });

    // Find the approval URL
    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'payer-action')?.href
      || orderData.links?.find((link: any) => link.rel === 'approve')?.href;

    return res.status(200).json({
      orderId: orderData.id,
      approvalUrl,
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function captureOrder(req: VercelRequest, res: VercelResponse) {
  try {
    const { token: orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get payment settings from database
    const settings = await getPaymentSettings();

    if (!settings.paypal.clientId || !settings.paypal.clientSecret) {
      return res.status(500).json({ error: 'PayPal is not configured' });
    }

    const PAYPAL_BASE_URL = settings.paypal.sandboxMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        providerOrderId: orderId.toString(),
        provider: 'PAYPAL',
      },
      include: { contest: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const accessToken = await getPayPalAccessToken(
      settings.paypal.clientId,
      settings.paypal.clientSecret,
      settings.paypal.sandboxMode
    );

    // Capture the order
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await response.json();

    if (!response.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture error:', captureData);

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/dashboard?payment=failed&contestId=${payment.contestId}`);
    }

    // Update payment as completed
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        providerPaymentId: captureId,
        paidAt: new Date(),
      },
    });

    // Update contest status to OPEN
    await prisma.contest.update({
      where: { id: payment.contestId },
      data: { status: 'OPEN' },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Pagamento ricevuto',
        message: `Il pagamento per il concorso "${payment.contest.title}" è stato completato. Il tuo concorso è ora attivo!`,
        link: `/contests/${payment.contestId}`,
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/dashboard?payment=success&contestId=${payment.contestId}`);
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
