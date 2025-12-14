import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) return false;

  const payload = verifyAccessToken(token);
  if (!payload) return false;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    return getContests(req, res);
  } else if (req.method === 'PUT') {
    return updateContest(req, res);
  } else if (req.method === 'DELETE') {
    return deleteContest(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getContests(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toString().toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search.toString(), mode: 'insensitive' } },
        { location: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { proposals: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.contest.count({ where }),
    ]);

    return res.status(200).json({
      contests: contests.map((c) => ({
        ...c,
        proposalsCount: c._count.proposals,
      })),
      total,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get contests error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateContest(req: VercelRequest, res: VercelResponse) {
  try {
    const { contestId, status, isFeatured, title, description } = req.body;

    if (!contestId) {
      return res.status(400).json({ error: 'Contest ID required' });
    }

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const contest = await prisma.contest.update({
      where: { id: contestId },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(200).json(contest);
  } catch (error) {
    console.error('Update contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteContest(req: VercelRequest, res: VercelResponse) {
  try {
    const { contestId } = req.body;

    if (!contestId) {
      return res.status(400).json({ error: 'Contest ID required' });
    }

    await prisma.contest.delete({
      where: { id: contestId },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
