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
  const { contestId, proposalId, action } = req.query;

  // GET /api/proposals?contestId=xxx - Get proposals for a contest
  if (req.method === 'GET' && contestId) {
    return getProposals(contestId as string, res);
  }

  // POST /api/proposals - Create a new proposal
  if (req.method === 'POST') {
    return createProposal(req, res);
  }

  // PUT /api/proposals?proposalId=xxx&action=winner - Select winner
  if (req.method === 'PUT' && proposalId && action === 'winner') {
    return selectWinner(proposalId as string, req, res);
  }

  // PUT /api/proposals?proposalId=xxx&action=withdraw - Withdraw proposal
  if (req.method === 'PUT' && proposalId && action === 'withdraw') {
    return withdrawProposal(proposalId as string, req, res);
  }

  // PUT /api/proposals?proposalId=xxx&action=update - Update proposal
  if (req.method === 'PUT' && proposalId && action === 'update') {
    return updateProposal(proposalId as string, req, res);
  }

  // PUT /api/proposals?proposalId=xxx&action=feedback - Add feedback
  if (req.method === 'PUT' && proposalId && action === 'feedback') {
    return addFeedback(proposalId as string, req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getProposals(contestId: string, res: VercelResponse) {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { contestId },
      include: {
        architect: {
          select: { id: true, name: true, avatarUrl: true, bio: true },
        },
        files: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json({ proposals, total: proposals.length });
  } catch (error) {
    console.error('Get proposals error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createProposal(req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { contestId, description, fileIds = [] } = req.body;

    if (!contestId) {
      return res.status(400).json({ error: 'Contest ID is required' });
    }

    // Check if contest exists and is open
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (contest.status !== 'OPEN') {
      return res.status(400).json({ error: 'Contest is not accepting proposals' });
    }

    // Check if user already submitted a proposal
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        contestId,
        architectId: payload.userId,
      },
    });

    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal for this contest' });
    }

    const proposal = await prisma.proposal.create({
      data: {
        contestId,
        architectId: payload.userId,
        description,
        files: fileIds.length > 0 ? {
          connect: fileIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        architect: {
          select: { id: true, name: true, avatarUrl: true },
        },
        files: true,
      },
    });

    // Create notification for contest owner
    await prisma.notification.create({
      data: {
        userId: contest.clientId,
        type: 'CONTEST_NEW_PROPOSAL',
        title: 'Nuova proposta ricevuta',
        message: `Hai ricevuto una nuova proposta per "${contest.title}"`,
        link: `/contest/${contestId}`,
      },
    });

    return res.status(201).json(proposal);
  } catch (error) {
    console.error('Create proposal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function selectWinner(proposalId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get proposal with contest
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        contest: true,
        architect: {
          select: { id: true, name: true },
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if user owns the contest
    if (proposal.contest.clientId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized to select winner for this contest' });
    }

    // Check if a winner is already selected
    const existingWinner = await prisma.proposal.findFirst({
      where: {
        contestId: proposal.contestId,
        status: 'WINNER',
      },
    });

    if (existingWinner) {
      return res.status(400).json({ error: 'A winner has already been selected for this contest' });
    }

    // Update proposal status to WINNER
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'WINNER' },
      include: {
        architect: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Update contest status to CLOSED
    await prisma.contest.update({
      where: { id: proposal.contestId },
      data: { status: 'CLOSED' },
    });

    // Notify the winning architect
    await prisma.notification.create({
      data: {
        userId: proposal.architectId,
        type: 'CONTEST_WINNER',
        title: 'Hai vinto il concorso!',
        message: `La tua proposta è stata selezionata come vincitrice per "${proposal.contest.title}"`,
        link: `/contest/${proposal.contestId}`,
      },
    });

    return res.status(200).json(updatedProposal);
  } catch (error) {
    console.error('Select winner error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function withdrawProposal(proposalId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        contest: { select: { status: true, title: true, clientId: true } },
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.architectId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can't withdraw if already winner or rejected
    if (proposal.status === 'WINNER') {
      return res.status(400).json({ error: 'Cannot withdraw a winning proposal' });
    }
    if (proposal.status === 'REJECTED') {
      return res.status(400).json({ error: 'Proposal was already rejected' });
    }
    if (proposal.status === 'WITHDRAWN') {
      return res.status(400).json({ error: 'Proposal was already withdrawn' });
    }

    // Can only withdraw if contest is still open
    if (proposal.contest.status !== 'OPEN' && proposal.contest.status !== 'EVALUATING') {
      return res.status(400).json({ error: 'Cannot withdraw from a closed contest' });
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
      },
    });

    // Notify contest owner
    await prisma.notification.create({
      data: {
        userId: proposal.contest.clientId,
        type: 'SYSTEM',
        title: 'Proposta ritirata',
        message: `Una proposta per "${proposal.contest.title}" è stata ritirata`,
        link: `/contest/${proposal.contestId}`,
      },
    });

    return res.status(200).json(updatedProposal);
  } catch (error) {
    console.error('Withdraw proposal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateProposal(proposalId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { contest: { select: { status: true } } },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.architectId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only update if contest is still open
    if (proposal.contest.status !== 'OPEN') {
      return res.status(400).json({ error: 'Cannot update proposal for a closed contest' });
    }

    // Can only update if not yet selected/rejected
    if (proposal.status !== 'SUBMITTED' && proposal.status !== 'UNDER_REVIEW') {
      return res.status(400).json({ error: 'Cannot update this proposal' });
    }

    const { description, addFileIds, removeFileIds } = req.body;

    const updateData: any = {};
    if (description !== undefined) {
      updateData.description = description;
    }

    // Handle file updates
    if (addFileIds?.length > 0) {
      updateData.files = {
        connect: addFileIds.map((id: string) => ({ id })),
      };
    }
    if (removeFileIds?.length > 0) {
      updateData.files = {
        ...updateData.files,
        disconnect: removeFileIds.map((id: string) => ({ id })),
      };
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        architect: { select: { id: true, name: true, avatarUrl: true } },
        files: true,
      },
    });

    return res.status(200).json(updatedProposal);
  } catch (error) {
    console.error('Update proposal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function addFeedback(proposalId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get proposal with contest
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        contest: { select: { clientId: true, title: true } },
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Only contest owner can add feedback
    if (proposal.contest.clientId !== payload.userId) {
      return res.status(403).json({ error: 'Only contest owner can add feedback' });
    }

    const { feedback, status } = req.body;

    const updateData: any = {};
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }
    if (status && ['UNDER_REVIEW', 'SELECTED', 'REJECTED'].includes(status)) {
      updateData.status = status;
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        architect: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify architect if feedback was added
    if (feedback) {
      await prisma.notification.create({
        data: {
          userId: proposal.architectId,
          type: 'SYSTEM',
          title: 'Feedback ricevuto',
          message: `Hai ricevuto un feedback per la tua proposta a "${proposal.contest.title}"`,
          link: `/contest/${proposal.contestId}`,
        },
      });
    }

    return res.status(200).json(updatedProposal);
  } catch (error) {
    console.error('Add feedback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
