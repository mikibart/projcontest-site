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
  const { id: practiceId } = req.query;

  if (!practiceId || typeof practiceId !== 'string') {
    return res.status(400).json({ error: 'ID pratica richiesto' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, practiceId);
      case 'PUT':
        return handlePut(req, res, practiceId);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Practice API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Get practice details
async function handleGet(req: VercelRequest, res: VercelResponse, practiceId: string) {
  const token = getTokenFromHeader(req.headers.authorization || null);

  const practice = await prisma.practiceRequest.findUnique({
    where: { id: practiceId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      engineer: { select: { id: true, name: true, email: true, phone: true } },
      files: true,
    },
  });

  if (!practice) {
    return res.status(404).json({ error: 'Pratica non trovata' });
  }

  // If authenticated, check permissions
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true },
      });

      // Admin, assigned engineer, or owner can see full details
      const isOwner = practice.userId === payload.userId;
      const isEngineer = practice.engineerId === payload.userId;
      const isAdmin = user?.role === 'ADMIN';

      if (isOwner || isEngineer || isAdmin) {
        return res.status(200).json(practice);
      }
    }
  }

  // Return limited info for unauthorized
  return res.status(200).json({
    id: practice.id,
    type: practice.type,
    propertyType: practice.propertyType,
    location: practice.location,
    status: practice.status,
  });
}

// PUT: Update practice (engineer actions)
async function handlePut(req: VercelRequest, res: VercelResponse, practiceId: string) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const practice = await prisma.practiceRequest.findUnique({
    where: { id: practiceId },
    select: { userId: true, engineerId: true, status: true, type: true },
  });

  if (!practice) {
    return res.status(404).json({ error: 'Pratica non trovata' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true, name: true },
  });

  const isOwner = practice.userId === payload.userId;
  const isEngineer = practice.engineerId === payload.userId;
  const isAdmin = user?.role === 'ADMIN';

  const { action } = req.body;

  // ENGINEER ACTIONS
  if (action === 'send-quote') {
    if (!isEngineer && !isAdmin) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const { quoteAmount, quoteValidDays = 30, quoteNotes } = req.body;

    if (!quoteAmount || quoteAmount <= 0) {
      return res.status(400).json({ error: 'Importo preventivo non valido' });
    }

    const quoteValidUntil = new Date();
    quoteValidUntil.setDate(quoteValidUntil.getDate() + parseInt(quoteValidDays));

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: {
        status: 'QUOTE_SENT',
        quoteAmount: parseFloat(quoteAmount),
        quoteValidUntil,
        quoteNotes: quoteNotes?.trim() || null,
      },
    });

    // Notify owner
    if (practice.userId) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_QUOTE',
          title: 'Preventivo ricevuto',
          message: `Hai ricevuto un preventivo di €${quoteAmount} per ${practice.type}`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updated);
  }

  if (action === 'update-progress') {
    if (!isEngineer && !isAdmin) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const { progressPercent, progressNotes } = req.body;

    const updateData: any = {};
    if (progressPercent !== undefined) {
      updateData.progressPercent = Math.min(100, Math.max(0, parseInt(progressPercent)));
    }
    if (progressNotes !== undefined) {
      updateData.progressNotes = progressNotes?.trim() || null;
    }

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: updateData,
    });

    // Notify owner about progress update
    if (practice.userId && progressPercent !== undefined) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_UPDATE',
          title: 'Aggiornamento pratica',
          message: `La tua pratica ${practice.type} è al ${updateData.progressPercent}%`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updated);
  }

  if (action === 'complete') {
    if (!isEngineer && !isAdmin) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: new Date(),
      },
    });

    // Notify owner
    if (practice.userId) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_COMPLETED',
          title: 'Pratica completata',
          message: `La tua pratica ${practice.type} è stata completata`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updated);
  }

  // CLIENT ACTIONS
  if (action === 'accept-quote') {
    if (!isOwner) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    if (practice.status !== 'QUOTE_SENT') {
      return res.status(400).json({ error: 'Nessun preventivo da accettare' });
    }

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: { status: 'ACCEPTED' },
    });

    // Notify engineer
    if (practice.engineerId) {
      await prisma.notification.create({
        data: {
          userId: practice.engineerId,
          type: 'PRACTICE_UPDATE',
          title: 'Preventivo accettato',
          message: `Il preventivo per ${practice.type} è stato accettato`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updated);
  }

  if (action === 'reject-quote') {
    if (!isOwner) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    if (practice.status !== 'QUOTE_SENT') {
      return res.status(400).json({ error: 'Nessun preventivo da rifiutare' });
    }

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: {
        status: 'PENDING_QUOTE',
        quoteAmount: null,
        quoteValidUntil: null,
        quoteNotes: null,
        engineerId: null, // Release the practice
      },
    });

    return res.status(200).json(updated);
  }

  if (action === 'start-work') {
    if (!isEngineer && !isAdmin) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    if (practice.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Il preventivo deve essere accettato prima' });
    }

    const updated = await prisma.practiceRequest.update({
      where: { id: practiceId },
      data: { status: 'IN_PROGRESS' },
    });

    // Notify owner
    if (practice.userId) {
      await prisma.notification.create({
        data: {
          userId: practice.userId,
          type: 'PRACTICE_UPDATE',
          title: 'Lavori iniziati',
          message: `I lavori per ${practice.type} sono iniziati`,
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json(updated);
  }

  return res.status(400).json({ error: 'Azione non valida' });
}
