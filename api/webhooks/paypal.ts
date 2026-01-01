import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
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

async function verifyWebhookSignature(req: VercelRequest, body: string): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: req.headers['paypal-auth-algo'],
        cert_url: req.headers['paypal-cert-url'],
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        transmission_time: req.headers['paypal-transmission-time'],
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    });

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = JSON.stringify(req.body);

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature(req, body);
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event.event_type;

    console.log(`PayPal webhook received: ${eventType}`);

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event.resource);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event.resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await handlePaymentFailed(event.resource);
        break;

      case 'CHECKOUT.ORDER.COMPLETED':
        await handleOrderCompleted(event.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleOrderApproved(resource: any) {
  const orderId = resource.id;

  // Update payment status to processing
  await prisma.payment.updateMany({
    where: {
      providerOrderId: orderId,
      provider: 'PAYPAL',
    },
    data: {
      status: 'PROCESSING',
    },
  });

  console.log(`Order approved: ${orderId}`);
}

async function handlePaymentCaptureCompleted(resource: any) {
  const captureId = resource.id;
  const orderId = resource.supplementary_data?.related_ids?.order_id;

  if (!orderId) {
    console.error('No order ID in capture resource');
    return;
  }

  // Find and update the payment
  const payment = await prisma.payment.findFirst({
    where: {
      providerOrderId: orderId,
      provider: 'PAYPAL',
    },
    include: { contest: true },
  });

  if (!payment) {
    console.error('Payment not found for order:', orderId);
    return;
  }

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

  console.log(`Payment capture completed: ${captureId}`);
}

async function handleOrderCompleted(resource: any) {
  const orderId = resource.id;

  // Find and update the payment
  const payment = await prisma.payment.findFirst({
    where: {
      providerOrderId: orderId,
      provider: 'PAYPAL',
    },
    include: { contest: true },
  });

  if (!payment) {
    console.error('Payment not found for order:', orderId);
    return;
  }

  // Check if already completed (might have been handled by capture event)
  if (payment.status === 'COMPLETED') {
    return;
  }

  const captureId = resource.purchase_units?.[0]?.payments?.captures?.[0]?.id;

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

  console.log(`Order completed: ${orderId}`);
}

async function handlePaymentFailed(resource: any) {
  const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

  await prisma.payment.updateMany({
    where: {
      providerOrderId: orderId,
      provider: 'PAYPAL',
    },
    data: {
      status: 'FAILED',
    },
  });

  console.log(`Payment failed: ${orderId}`);
}
