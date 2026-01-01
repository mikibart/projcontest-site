import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { contestId, userId } = session.metadata || {};

  if (!contestId || !userId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update payment record
  const payment = await prisma.payment.findFirst({
    where: {
      providerOrderId: session.id,
      provider: 'STRIPE',
    },
  });

  if (!payment) {
    console.error('Payment not found for session:', session.id);
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      providerPaymentId: session.payment_intent as string,
      paidAt: new Date(),
    },
  });

  // Update contest status to OPEN
  const contest = await prisma.contest.update({
    where: { id: contestId },
    data: { status: 'OPEN' },
  });

  // Notify the user
  await prisma.notification.create({
    data: {
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Pagamento ricevuto',
      message: `Il pagamento per il concorso "${contest.title}" è stato completato. Il tuo concorso è ora attivo!`,
      link: `/contests/${contestId}`,
    },
  });

  console.log(`Payment completed for contest ${contestId}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Update payment as failed
  await prisma.payment.updateMany({
    where: {
      providerOrderId: session.id,
      provider: 'STRIPE',
      status: 'PENDING',
    },
    data: {
      status: 'FAILED',
    },
  });

  console.log(`Checkout session expired: ${session.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update payment as failed
  await prisma.payment.updateMany({
    where: {
      providerPaymentId: paymentIntent.id,
      provider: 'STRIPE',
    },
    data: {
      status: 'FAILED',
    },
  });

  console.log(`Payment failed: ${paymentIntent.id}`);
}
