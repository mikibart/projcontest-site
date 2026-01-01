import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return createCheckoutSession(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function createCheckoutSession(req: VercelRequest, res: VercelResponse) {
  try {
    // Get payment settings from database
    const settings = await getPaymentSettings();

    // Check if Stripe is enabled
    if (!settings.stripe.enabled) {
      return res.status(400).json({ error: 'Stripe payments are not enabled' });
    }

    // Check if Stripe is configured
    if (!settings.stripe.secretKey) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Initialize Stripe with settings from database
    const stripe = new Stripe(settings.stripe.secretKey, {
      apiVersion: '2025-12-15.clover',
    });

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
    const platformFee = Math.round(contest.budget * feePercent * 100); // In cents
    const amountInCents = platformFee;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Pubblicazione concorso: ${contest.title}`,
              description: `Quota di pubblicazione per il concorso "${contest.title}"`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/dashboard?payment=success&contestId=${contestId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://projcontest-site.vercel.app'}/dashboard?payment=cancelled&contestId=${contestId}`,
      metadata: {
        contestId,
        userId: payload.userId,
      },
      customer_email: contest.client.email,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        amount: amountInCents / 100, // Store in euros
        currency: 'EUR',
        status: 'PENDING',
        provider: 'STRIPE',
        providerOrderId: session.id,
        contestId,
        userId: payload.userId,
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
