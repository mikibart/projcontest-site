import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { verifyAccessToken, getTokenFromHeader } from '../../lib/auth';

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
      limit = '10'
    } = req.query;

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category.toString().toUpperCase();
    }

    if (status) {
      where.status = status.toString().toUpperCase();
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
      },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json(contest);
  } catch (error) {
    console.error('Create contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
