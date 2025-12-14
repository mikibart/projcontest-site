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

async function verifyAdmin(req: VercelRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) return { isAdmin: false };

  const payload = verifyAccessToken(token);
  if (!payload) return { isAdmin: false };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  return {
    isAdmin: user?.role === 'ADMIN',
    userId: payload.userId,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { isAdmin } = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { action } = req.query;

  // Route based on action parameter
  switch (action) {
    case 'stats':
      return handleStats(req, res);
    case 'users':
      return handleUsers(req, res);
    case 'contests':
      return handleContests(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action. Use ?action=stats|users|contests' });
  }
}

// ==================== STATS ====================
async function handleStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      totalUsers,
      usersByRole,
      totalContests,
      contestsByStatus,
      totalProposals,
      totalPractices,
      recentUsers,
      recentContests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.contest.count(),
      prisma.contest.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.proposal.count(),
      prisma.practiceRequest.count(),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.contest.findMany({
        select: {
          id: true, title: true, status: true, budget: true, createdAt: true,
          client: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const usersRoleMap: Record<string, number> = {};
    usersByRole.forEach((item) => { usersRoleMap[item.role] = item._count.role; });

    const contestsStatusMap: Record<string, number> = {};
    contestsByStatus.forEach((item) => { contestsStatusMap[item.status] = item._count.status; });

    return res.status(200).json({
      stats: { totalUsers, totalContests, totalProposals, totalPractices, usersByRole: usersRoleMap, contestsByStatus: contestsStatusMap },
      recentUsers,
      recentContests,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== USERS ====================
async function handleUsers(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getUsers(req, res);
  } else if (req.method === 'PUT') {
    return updateUser(req, res);
  } else if (req.method === 'DELETE') {
    return deleteUser(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getUsers(req: VercelRequest, res: VercelResponse) {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (role && role !== 'all') where.role = role.toString().toUpperCase();
    if (search) {
      where.OR = [
        { name: { contains: search.toString(), mode: 'insensitive' } },
        { email: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true,
          _count: { select: { contests: true, proposals: true, practiceRequests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({ users, total, page: parseInt(page.toString()), totalPages: Math.ceil(total / parseInt(limit.toString())) });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUser(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId, role, name, email } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const updateData: any = {};
    if (role) updateData.role = role.toUpperCase();
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    await prisma.user.delete({ where: { id: userId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== CONTESTS ====================
async function handleContests(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getContests(req, res);
  } else if (req.method === 'PUT') {
    return updateContest(req, res);
  } else if (req.method === 'DELETE') {
    return deleteContest(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getContests(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status.toString().toUpperCase();
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
          client: { select: { id: true, name: true, email: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.contest.count({ where }),
    ]);

    return res.status(200).json({
      contests: contests.map((c) => ({ ...c, proposalsCount: c._count.proposals })),
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
    if (!contestId) return res.status(400).json({ error: 'Contest ID required' });

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const contest = await prisma.contest.update({
      where: { id: contestId },
      data: updateData,
      include: { client: { select: { id: true, name: true } } },
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
    if (!contestId) return res.status(400).json({ error: 'Contest ID required' });

    await prisma.contest.delete({ where: { id: contestId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete contest error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
