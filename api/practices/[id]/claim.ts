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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  try {
    const { id: practiceId } = req.query;

    if (!practiceId || typeof practiceId !== 'string') {
      return res.status(400).json({ error: 'ID pratica richiesto' });
    }

    // Verify user is an engineer
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (user.role !== 'ENGINEER' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo gli ingegneri possono accettare incarichi' });
    }

    // Get practice
    const practice = await prisma.practiceRequest.findUnique({
      where: { id: practiceId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!practice) {
      return res.status(404).json({ error: 'Pratica non trovata' });
    }

    // Check if already claimed
    if (practice.engineerId) {
      return res.status(400).json({ error: 'Questa pratica è già stata assegnata' });
    }

    // Check if practice is in valid state
    if (practice.status !== 'PENDING_QUOTE') {
      return res.status(400).json({ error: 'Questa pratica non può essere accettata' });
    }

    // Claim the practice
    const updatedPractice = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: {
        engineerId: payload.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        engineer: { select: { id: true, name: true, email: true } },
        files: true,
      },
    });

    // Notify user if they exist
    if (practice.userId) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_CLAIMED',
          title: 'Incarico assegnato',
          message: `${user.name} ha preso in carico la tua richiesta di ${practice.type}`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updatedPractice);
  } catch (error) {
    console.error('Claim practice error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
