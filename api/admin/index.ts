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
    case 'practices':
      return handlePractices(req, res);
    case 'payments':
      return handlePayments(req, res);
    case 'proposals':
      return handleProposals(req, res);
    case 'contest-detail':
      return getContestDetail(req, res);
    case 'user-detail':
      return getUserDetail(req, res);
    case 'files':
      return handleFiles(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
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

// ==================== PRACTICES ====================
async function handlePractices(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getPractices(req, res);
  } else if (req.method === 'PUT') {
    return updatePractice(req, res);
  } else if (req.method === 'DELETE') {
    return deletePractice(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getPractices(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, type, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status.toString().toUpperCase();
    if (type && type !== 'all') where.type = type.toString().toUpperCase();
    if (search) {
      where.OR = [
        { contactName: { contains: search.toString(), mode: 'insensitive' } },
        { contactEmail: { contains: search.toString(), mode: 'insensitive' } },
        { location: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [practices, total] = await Promise.all([
      prisma.practiceRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          files: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.practiceRequest.count({ where }),
    ]);

    return res.status(200).json({
      practices,
      total,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get practices error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updatePractice(req: VercelRequest, res: VercelResponse) {
  try {
    const { practiceId, status, quoteAmount, quoteValidUntil, engineerId } = req.body;
    if (!practiceId) return res.status(400).json({ error: 'Practice ID required' });

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (quoteAmount !== undefined) updateData.quoteAmount = parseFloat(quoteAmount);
    if (quoteValidUntil) updateData.quoteValidUntil = new Date(quoteValidUntil);
    if (engineerId) updateData.engineerId = engineerId;

    const practice = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        files: true,
      },
    });

    // Create notification if quote was sent
    if (quoteAmount && practice.userId) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_QUOTE',
          title: 'Preventivo ricevuto',
          message: `Hai ricevuto un preventivo di €${quoteAmount} per la tua richiesta`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(practice);
  } catch (error) {
    console.error('Update practice error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deletePractice(req: VercelRequest, res: VercelResponse) {
  try {
    const { practiceId } = req.body;
    if (!practiceId) return res.status(400).json({ error: 'Practice ID required' });

    await prisma.practiceRequest.delete({ where: { id: practiceId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete practice error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== PAYMENTS ====================
async function handlePayments(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getPayments(req, res);
  } else if (req.method === 'PUT') {
    return updatePayment(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getPayments(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, provider, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status.toString().toUpperCase();
    if (provider && provider !== 'all') where.provider = provider.toString().toUpperCase();

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [payments, total, totalAmount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          contest: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return res.status(200).json({
      payments,
      total,
      totalAmount: totalAmount._sum.amount || 0,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updatePayment(req: VercelRequest, res: VercelResponse) {
  try {
    const { paymentId, status } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'Payment ID required' });

    const updateData: any = {};
    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'COMPLETED') {
        updateData.paidAt = new Date();
      }
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        contest: { select: { id: true, title: true } },
      },
    });

    return res.status(200).json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== PROPOSALS ====================
async function handleProposals(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getProposalsAdmin(req, res);
  } else if (req.method === 'PUT') {
    return updateProposal(req, res);
  } else if (req.method === 'DELETE') {
    return deleteProposal(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getProposalsAdmin(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, contestId, search, page = '1', limit = '20' } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status.toString().toUpperCase();
    if (contestId) where.contestId = contestId.toString();

    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          architect: { select: { id: true, name: true, email: true, avatarUrl: true } },
          contest: { select: { id: true, title: true, client: { select: { name: true } } } },
          files: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.proposal.count({ where }),
    ]);

    return res.status(200).json({
      proposals,
      total,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateProposal(req: VercelRequest, res: VercelResponse) {
  try {
    const { proposalId, status, feedback } = req.body;
    if (!proposalId) return res.status(400).json({ error: 'Proposal ID required' });

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (feedback !== undefined) updateData.feedback = feedback;

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        architect: { select: { id: true, name: true, email: true } },
        contest: { select: { id: true, title: true } },
      },
    });

    return res.status(200).json(proposal);
  } catch (error) {
    console.error('Update proposal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteProposal(req: VercelRequest, res: VercelResponse) {
  try {
    const { proposalId } = req.body;
    if (!proposalId) return res.status(400).json({ error: 'Proposal ID required' });

    await prisma.proposal.delete({ where: { id: proposalId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete proposal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== DETAIL VIEWS ====================
async function getContestDetail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Contest ID required' });

    const contest = await prisma.contest.findUnique({
      where: { id: id.toString() },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        proposals: {
          include: {
            architect: {
              select: { id: true, name: true, email: true, avatarUrl: true, bio: true, portfolio: true },
            },
            files: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
        files: true,
        qaMessages: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    return res.status(200).json(contest);
  } catch (error) {
    console.error('Get contest detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserDetail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'User ID required' });

    const user = await prisma.user.findUnique({
      where: { id: id.toString() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        portfolio: true,
        phone: true,
        createdAt: true,
        contests: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            createdAt: true,
            _count: { select: { proposals: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        proposals: {
          include: {
            contest: { select: { id: true, title: true } },
            files: true,
          },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        },
        practiceRequests: {
          include: { files: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          include: {
            contest: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        files: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== FILES ====================
async function handleFiles(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getFiles(req, res);
  } else if (req.method === 'DELETE') {
    const { deleteAllOrphans } = req.body || {};
    if (deleteAllOrphans) {
      return deleteOrphanFiles(req, res);
    }
    return deleteFile(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getFiles(req: VercelRequest, res: VercelResponse) {
  try {
    const { filter, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

    let where: any = {};

    // Filter for orphan files (no associations)
    if (filter === 'orphan') {
      where = {
        AND: [
          { contestId: null },
          { proposalId: null },
          { practiceId: null },
          { userId: null },
        ],
      };
    } else if (filter === 'contest') {
      where = { contestId: { not: null } };
    } else if (filter === 'proposal') {
      where = { proposalId: { not: null } };
    } else if (filter === 'practice') {
      where = { practiceId: { not: null } };
    }

    if (search) {
      where.OR = [
        { filename: { contains: search.toString(), mode: 'insensitive' } },
        { originalName: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const [files, total, orphanCount] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          contest: { select: { id: true, title: true } },
          proposal: {
            select: {
              id: true,
              contest: { select: { title: true } },
              architect: { select: { name: true } },
            }
          },
          practice: { select: { id: true, type: true, contactName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.file.count({ where }),
      prisma.file.count({
        where: {
          AND: [
            { contestId: null },
            { proposalId: null },
            { practiceId: null },
            { userId: null },
          ],
        },
      }),
    ]);

    // Calculate total storage used
    const totalStorage = await prisma.file.aggregate({
      _sum: { size: true },
    });

    return res.status(200).json({
      files: files.map(f => ({
        ...f,
        isOrphan: !f.contestId && !f.proposalId && !f.practiceId && !f.userId,
        association: f.contestId ? 'Concorso' :
                    f.proposalId ? 'Proposta' :
                    f.practiceId ? 'Pratica' :
                    f.userId ? 'Utente' : 'Nessuna',
      })),
      total,
      orphanCount,
      totalStorage: totalStorage._sum.size || 0,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get files error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteFile(req: VercelRequest, res: VercelResponse) {
  try {
    const { fileId, deleteFromBlob } = req.body;
    if (!fileId) return res.status(400).json({ error: 'File ID required' });

    // Get file info first
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from Vercel Blob if requested
    if (deleteFromBlob && file.url) {
      try {
        const { del } = await import('@vercel/blob');
        await del(file.url);
      } catch (blobError) {
        console.error('Failed to delete from blob:', blobError);
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete from database
    await prisma.file.delete({ where: { id: fileId } });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteOrphanFiles(req: VercelRequest, res: VercelResponse) {
  try {
    // Find all orphan files
    const orphanFiles = await prisma.file.findMany({
      where: {
        AND: [
          { contestId: null },
          { proposalId: null },
          { practiceId: null },
          { userId: null },
        ],
      },
    });

    // Delete from Vercel Blob
    try {
      const { del } = await import('@vercel/blob');
      for (const file of orphanFiles) {
        if (file.url) {
          try {
            await del(file.url);
          } catch (e) {
            console.error(`Failed to delete blob for file ${file.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.error('Blob import/delete error:', e);
    }

    // Delete from database
    const result = await prisma.file.deleteMany({
      where: {
        AND: [
          { contestId: null },
          { proposalId: null },
          { practiceId: null },
          { userId: null },
        ],
      },
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Delete orphan files error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
