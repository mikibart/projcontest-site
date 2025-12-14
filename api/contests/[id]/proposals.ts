import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../_lib/prisma.js';
import { verifyAccessToken, getTokenFromHeader } from '../../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Contest ID is required' });
  }

  if (req.method === 'GET') {
    return getProposals(id, res);
  } else if (req.method === 'POST') {
    return createProposal(id, req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getProposals(contestId: string, res: VercelResponse) {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { contestId },
      include: {
        architect: {
          select: { id: true, name: true, avatarUrl: true, portfolio: true },
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

async function createProposal(contestId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
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

    const { description, fileIds = [] } = req.body;

    const proposal = await prisma.proposal.create({
      data: {
        contestId,
        architectId: payload.userId,
        description,
        files: {
          connect: fileIds.map((id: string) => ({ id })),
        },
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
