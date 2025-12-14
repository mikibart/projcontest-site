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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
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
      // Total users
      prisma.user.count(),
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      // Total contests
      prisma.contest.count(),
      // Contests by status
      prisma.contest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Total proposals
      prisma.proposal.count(),
      // Total practice requests
      prisma.practiceRequest.count(),
      // Recent users (last 5)
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Recent contests (last 5)
      prisma.contest.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          budget: true,
          createdAt: true,
          client: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Format users by role
    const usersRoleMap: Record<string, number> = {};
    usersByRole.forEach((item) => {
      usersRoleMap[item.role] = item._count.role;
    });

    // Format contests by status
    const contestsStatusMap: Record<string, number> = {};
    contestsByStatus.forEach((item) => {
      contestsStatusMap[item.status] = item._count.status;
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalContests,
        totalProposals,
        totalPractices,
        usersByRole: usersRoleMap,
        contestsByStatus: contestsStatusMap,
      },
      recentUsers,
      recentContests,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
