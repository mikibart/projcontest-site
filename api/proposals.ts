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
        type: 'CONTEST_WON',
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
