import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
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
  const { id: contestId } = req.query;

  if (!contestId || typeof contestId !== 'string') {
    return res.status(400).json({ error: 'ID concorso richiesto' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, contestId);
      case 'POST':
        return handlePost(req, res, contestId);
      case 'PUT':
        return handlePut(req, res, contestId);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Q&A API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Fetch all Q&A for a contest (public)
async function handleGet(req: VercelRequest, res: VercelResponse, contestId: string) {
  const qaMessages = await prisma.qAMessage.findMany({
    where: { contestId },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ qaMessages });
}

// POST: Submit a new question (requires auth)
async function handlePost(req: VercelRequest, res: VercelResponse, contestId: string) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { question } = req.body;
  if (!question?.trim()) {
    return res.status(400).json({ error: 'La domanda è obbligatoria' });
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, email: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'Utente non trovato' });
  }

  // Get contest and client
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { clientId: true, title: true },
  });

  if (!contest) {
    return res.status(404).json({ error: 'Concorso non trovato' });
  }

  // Create Q&A message
  const qaMessage = await prisma.qAMessage.create({
    data: {
      question: question.trim(),
      authorName: user.name,
      authorEmail: user.email,
      contestId,
    },
  });

  // Notify contest owner about new question
  await prisma.notification.create({
    data: {
      userId: contest.clientId,
      type: 'CONTEST_QA_NEW',
      title: 'Nuova domanda',
      message: `Hai ricevuto una nuova domanda per "${contest.title}"`,
      link: `/contest/${contestId}`,
    },
  });

  return res.status(201).json(qaMessage);
}

// PUT: Answer a question (contest owner only)
async function handlePut(req: VercelRequest, res: VercelResponse, contestId: string) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { qaId, answer } = req.body;
  if (!qaId || !answer?.trim()) {
    return res.status(400).json({ error: 'ID domanda e risposta sono obbligatori' });
  }

  // Check if user owns the contest
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { clientId: true, title: true },
  });

  if (!contest) {
    return res.status(404).json({ error: 'Concorso non trovato' });
  }

  if (contest.clientId !== payload.userId) {
    return res.status(403).json({ error: 'Solo il proprietario può rispondere' });
  }

  // Get the Q&A to find author
  const qa = await prisma.qAMessage.findUnique({
    where: { id: qaId },
    select: { authorEmail: true },
  });

  // Update Q&A with answer
  const qaMessage = await prisma.qAMessage.update({
    where: { id: qaId, contestId },
    data: {
      answer: answer.trim(),
      answeredAt: new Date(),
    },
  });

  // Find user by email to notify them (if they're registered)
  if (qa?.authorEmail) {
    const questionAuthor = await prisma.user.findUnique({
      where: { email: qa.authorEmail },
      select: { id: true },
    });

    if (questionAuthor) {
      await prisma.notification.create({
        data: {
          userId: questionAuthor.id,
          type: 'CONTEST_QA_ANSWER',
          title: 'Risposta ricevuta',
          message: `La tua domanda per "${contest.title}" ha ricevuto risposta`,
          link: `/contest/${contestId}`,
        },
      });
    }
  }

  return res.status(200).json(qaMessage);
}
