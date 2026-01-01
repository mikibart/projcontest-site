import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
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
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Reviews API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Fetch reviews for a user
async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { userId, contestId, page = '1', limit = '20' } = req.query;

  if (!userId && !contestId) {
    return res.status(400).json({ error: 'Specificare userId o contestId' });
  }

  const where: any = {};
  if (userId) where.revieweeId = userId.toString();
  if (contestId) where.contestId = contestId.toString();

  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  const [reviews, total, avgRating] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true, role: true } },
        reviewee: { select: { id: true, name: true, avatarUrl: true, role: true } },
        contest: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit.toString()),
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return res.status(200).json({
    reviews,
    total,
    averageRating: avgRating._avg.rating || 0,
    totalReviews: avgRating._count.rating,
    page: parseInt(page.toString()),
    totalPages: Math.ceil(total / parseInt(limit.toString())),
  });
}

// POST: Create a new review
async function handlePost(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { revieweeId, rating, comment, contestId } = req.body;

  if (!revieweeId || !rating) {
    return res.status(400).json({ error: 'Destinatario e valutazione sono obbligatori' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La valutazione deve essere tra 1 e 5' });
  }

  // Can't review yourself
  if (revieweeId === payload.userId) {
    return res.status(400).json({ error: 'Non puoi recensire te stesso' });
  }

  // Verify reviewee exists
  const reviewee = await prisma.user.findUnique({
    where: { id: revieweeId },
    select: { id: true, name: true },
  });

  if (!reviewee) {
    return res.status(404).json({ error: 'Utente non trovato' });
  }

  // If contestId provided, verify:
  // 1. Contest exists and is closed
  // 2. User was involved (either owner or proposal submitted)
  if (contestId) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        proposals: { where: { status: 'WINNER' }, select: { architectId: true } },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Concorso non trovato' });
    }

    if (contest.status !== 'CLOSED') {
      return res.status(400).json({ error: 'Puoi recensire solo dopo la chiusura del concorso' });
    }

    // Check involvement
    const isOwner = contest.clientId === payload.userId;
    const winningArchitectId = contest.proposals[0]?.architectId;
    const isWinner = winningArchitectId === payload.userId;

    if (!isOwner && !isWinner) {
      return res.status(403).json({ error: 'Non sei coinvolto in questo concorso' });
    }

    // Check the reviewee is the other party
    if (isOwner && revieweeId !== winningArchitectId) {
      return res.status(400).json({ error: 'Puoi solo recensire l\'architetto vincitore' });
    }
    if (isWinner && revieweeId !== contest.clientId) {
      return res.status(400).json({ error: 'Puoi solo recensire il committente' });
    }

    // Check if already reviewed for this contest
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_contestId: {
          reviewerId: payload.userId,
          contestId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Hai già recensito per questo concorso' });
    }
  }

  // Get reviewer info
  const reviewer = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true },
  });

  // Create review
  const review = await prisma.review.create({
    data: {
      rating,
      comment: comment?.trim() || null,
      reviewerId: payload.userId,
      revieweeId,
      contestId: contestId || null,
    },
    include: {
      reviewer: { select: { id: true, name: true, avatarUrl: true } },
      reviewee: { select: { id: true, name: true, avatarUrl: true } },
      contest: { select: { id: true, title: true } },
    },
  });

  // Notify reviewee
  await prisma.notification.create({
    data: {
      userId: revieweeId,
      type: 'REVIEW_RECEIVED',
      title: 'Nuova recensione',
      message: `${reviewer?.name || 'Un utente'} ti ha lasciato una recensione di ${rating} stelle`,
      link: `/profile/${revieweeId}`,
    },
  });

  return res.status(201).json(review);
}

// PUT: Update a review
async function handlePut(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { reviewId, rating, comment } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'ID recensione richiesto' });
  }

  // Verify ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { reviewerId: true },
  });

  if (!review) {
    return res.status(404).json({ error: 'Recensione non trovata' });
  }

  if (review.reviewerId !== payload.userId) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }

  const updateData: any = {};
  if (rating) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La valutazione deve essere tra 1 e 5' });
    }
    updateData.rating = rating;
  }
  if (comment !== undefined) updateData.comment = comment?.trim() || null;

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      reviewer: { select: { id: true, name: true, avatarUrl: true } },
      reviewee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return res.status(200).json(updatedReview);
}

// DELETE: Delete a review
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { reviewId } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'ID recensione richiesto' });
  }

  // Verify ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { reviewerId: true },
  });

  if (!review) {
    return res.status(404).json({ error: 'Recensione non trovata' });
  }

  if (review.reviewerId !== payload.userId) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return res.status(200).json({ success: true });
}
