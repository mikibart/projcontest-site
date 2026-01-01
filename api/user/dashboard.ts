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
    } else if (user.role === 'ENGINEER') {
      return getEngineerDashboard(payload.userId, res);
    } else {
      return getClientDashboard(payload.userId, res);
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getArchitectDashboard(userId: string, res: VercelResponse) {
  const [
    proposals,
    winningProposals,
    recentContests,
    notifications,
    reviewsReceived,
    unreadMessages,
    portfolio,
  ] = await Promise.all([
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
        contest: { select: { id: true, budget: true, title: true } },
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
    // Notifications
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Reviews received
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    // Unread messages count
    prisma.message.count({
      where: { receiverId: userId, read: false },
    }),
    // Portfolio projects
    prisma.portfolioProject.findMany({
      where: { userId },
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
      averageRating: reviewsReceived._avg.rating || 0,
      totalReviews: reviewsReceived._count.rating,
      unreadMessages,
    },
    proposals: proposals.slice(0, 10),
    wonContests: winningProposals.map(p => p.contest),
    recommendedContests: recentContests.map(c => ({
      ...c,
      proposalsCount: c._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    })),
    portfolio,
    notifications,
    unreadNotifications: notifications.filter(n => !n.read).length,
  });
}

async function getClientDashboard(userId: string, res: VercelResponse) {
  const [
    contests,
    practiceRequests,
    notifications,
    drafts,
    unreadMessages,
    reviewsGiven,
  ] = await Promise.all([
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
      include: {
        engineer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Notifications
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Saved drafts
    prisma.draftContest.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    // Unread messages count
    prisma.message.count({
      where: { receiverId: userId, read: false },
    }),
    // Reviews given count
    prisma.review.count({
      where: { reviewerId: userId },
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
      unreadMessages,
      draftsCount: drafts.length,
      reviewsGiven,
    },
    contests: contests.slice(0, 10).map(c => ({
      ...c,
      proposalsCount: c._count.proposals,
      daysRemaining: Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    })),
    practiceRequests: practiceRequests.slice(0, 5),
    drafts,
    notifications,
    unreadNotifications: notifications.filter(n => !n.read).length,
  });
}

async function getEngineerDashboard(userId: string, res: VercelResponse) {
  const [
    availablePractices,
    assignedPractices,
    completedPractices,
    notifications,
    unreadMessages,
  ] = await Promise.all([
    // Available practices (not yet claimed)
    prisma.practiceRequest.findMany({
      where: {
        engineerId: null,
        status: 'PENDING_QUOTE',
      },
      include: {
        user: { select: { id: true, name: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Assigned practices (in progress)
    prisma.practiceRequest.findMany({
      where: {
        engineerId: userId,
        status: { in: ['PENDING_QUOTE', 'QUOTE_SENT', 'ACCEPTED', 'IN_PROGRESS'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Completed practices
    prisma.practiceRequest.findMany({
      where: {
        engineerId: userId,
        status: 'COMPLETED',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    // Notifications
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Unread messages
    prisma.message.count({
      where: { receiverId: userId, read: false },
    }),
  ]);

  const totalEarnings = completedPractices.reduce((sum, p) => sum + (p.quoteAmount || 0), 0);
  const inProgressCount = assignedPractices.filter(p => p.status === 'IN_PROGRESS').length;

  return res.status(200).json({
    stats: {
      availablePractices: availablePractices.length,
      assignedPractices: assignedPractices.length,
      inProgress: inProgressCount,
      completedPractices: completedPractices.length,
      totalEarnings,
      unreadMessages,
    },
    availablePractices,
    assignedPractices,
    completedPractices,
    notifications,
    unreadNotifications: notifications.filter(n => !n.read).length,
  });
}
