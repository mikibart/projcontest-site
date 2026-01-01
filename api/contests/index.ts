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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getContests(req, res);
  } else if (req.method === 'POST') {
    return createContest(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getContests(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      category,
      status,
      search,
      minBudget,
      maxBudget,
      featured,
      page = '1',
      limit = '10',
      showAll // Admin param to show all statuses
    } = req.query;

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category.toString().toUpperCase();
    }

    // For public access, only show OPEN contests unless specific status requested
    if (status) {
      where.status = status.toString().toUpperCase();
    } else if (showAll !== 'true') {
      // Default: only show OPEN contests to public
      where.status = 'OPEN';
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search.toString(), mode: 'insensitive' } },
        { location: { contains: search.toString(), mode: 'insensitive' } },
        { description: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget.toString());
      if (maxBudget) where.budget.lte = parseFloat(maxBudget.toString());
    }

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, avatarUrl: true },
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

    // Add computed fields
    const contestsWithComputed = contests.map(contest => ({
      ...contest,
      proposalsCount: contest._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    }));

    return res.status(200).json({
      contests: contestsWithComputed,
      total,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get contests error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createContest(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify auth
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const {
      title,
      description,
      brief,
      location,
      category,
      budget,
      deadline,
      imageUrl,
      mustHaves = [],
      constraints = [],
      deliverables = [],
      fileIds = [],
    } = req.body;

    if (!title || !description || !location || !category || !budget || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        brief,
        location,
        category: category.toUpperCase(),
        budget: parseFloat(budget),
        deadline: new Date(deadline),
        imageUrl,
        mustHaves,
        constraints,
        deliverables,
        clientId: payload.userId,
        status: 'PENDING_APPROVAL', // New contests require admin approval
      },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Link uploaded files to the contest
    if (fileIds.length > 0) {
      await prisma.file.updateMany({
        where: {
          id: { in: fileIds },
          userId: payload.userId,
        },
        data: {
          contestId: contest.id,
        },
      });
    }

    // Notify admins about new contest pending approval
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Nuovo concorso da approvare',
          message: `Il concorso "${title}" è in attesa di approvazione.`,
          link: `/admin?contest=${contest.id}`,
        })),
      });
    }

    return res.status(201).json(contest);
  } catch (error) {
    console.error('Create contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
