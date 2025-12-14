import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { verifyAccessToken, getTokenFromHeader } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Contest ID is required' });
  }

  if (req.method === 'GET') {
    return getContest(id, res);
  } else if (req.method === 'PUT') {
    return updateContest(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteContest(id, req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getContest(id: string, res: VercelResponse) {
  try {
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        proposals: {
          include: {
            architect: {
              select: { id: true, name: true, avatarUrl: true },
            },
            files: true,
          },
        },
        files: true,
        qaMessages: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { proposals: true },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const contestWithComputed = {
      ...contest,
      proposalsCount: contest._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    };

    return res.status(200).json(contestWithComputed);
  } catch (error) {
    console.error('Get contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateContest(id: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check ownership
    const existing = await prisma.contest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (existing.clientId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const {
      title,
      description,
      brief,
      location,
      category,
      budget,
      deadline,
      status,
      imageUrl,
      isFeatured,
      mustHaves,
      constraints,
      deliverables,
    } = req.body;

    const contest = await prisma.contest.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(brief && { brief }),
        ...(location && { location }),
        ...(category && { category: category.toUpperCase() }),
        ...(budget && { budget: parseFloat(budget) }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status && { status: status.toUpperCase() }),
        ...(imageUrl && { imageUrl }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(mustHaves && { mustHaves }),
        ...(constraints && { constraints }),
        ...(deliverables && { deliverables }),
      },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return res.status(200).json(contest);
  } catch (error) {
    console.error('Update contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteContest(id: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check ownership
    const existing = await prisma.contest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (existing.clientId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.contest.delete({ where: { id } });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
