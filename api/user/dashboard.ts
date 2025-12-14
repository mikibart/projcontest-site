import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { verifyAccessToken, getTokenFromHeader } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ARCHITECT') {
      return getArchitectDashboard(payload.userId, res);
    } else {
      return getClientDashboard(payload.userId, res);
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getArchitectDashboard(userId: string, res: VercelResponse) {
  const [proposals, winningProposals, recentContests] = await Promise.all([
    // All proposals
    prisma.proposal.findMany({
      where: { architectId: userId },
      include: {
        contest: {
          select: { id: true, title: true, budget: true, deadline: true, status: true, imageUrl: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    // Winning proposals
    prisma.proposal.findMany({
      where: { architectId: userId, status: 'WINNER' },
      include: {
        contest: { select: { budget: true } },
      },
    }),
    // Recommended contests
    prisma.contest.findMany({
      where: { status: 'OPEN' },
      include: {
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalEarnings = winningProposals.reduce((sum, p) => sum + p.contest.budget, 0);

  return res.status(200).json({
    stats: {
      totalProposals: proposals.length,
      winningProposals: winningProposals.length,
      totalEarnings,
      activeProposals: proposals.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length,
    },
    proposals: proposals.slice(0, 10),
    recommendedContests: recentContests.map(c => ({
      ...c,
      proposalsCount: c._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    })),
  });
}

async function getClientDashboard(userId: string, res: VercelResponse) {
  const [contests, practiceRequests, notifications] = await Promise.all([
    // User's contests
    prisma.contest.findMany({
      where: { clientId: userId },
      include: {
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Practice requests
    prisma.practiceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Notifications
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const activeContests = contests.filter(c => c.status === 'OPEN' || c.status === 'EVALUATING');
  const totalProposalsReceived = contests.reduce((sum, c) => sum + c._count.proposals, 0);
  const activePractices = practiceRequests.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');

  return res.status(200).json({
    stats: {
      totalContests: contests.length,
      activeContests: activeContests.length,
      totalProposalsReceived,
      activePractices: activePractices.length,
    },
    contests: contests.slice(0, 10).map(c => ({
      ...c,
      proposalsCount: c._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    })),
    practiceRequests: practiceRequests.slice(0, 5),
    notifications,
    unreadNotifications: notifications.filter(n => !n.read).length,
  });
}
