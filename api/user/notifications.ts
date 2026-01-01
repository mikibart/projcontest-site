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
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, payload.userId);
      case 'PUT':
        return handlePut(req, res, payload.userId);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

  const where: any = { userId };
  if (unreadOnly === 'true') {
    where.read = false;
  }

  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit.toString()),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return res.status(200).json({
    notifications,
    total,
    unreadCount,
    page: parseInt(page.toString()),
    totalPages: Math.ceil(total / parseInt(limit.toString())),
  });
}

async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, notificationId } = req.body;

  if (action === 'mark-read' && notificationId) {
    // Mark single notification as read
    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return res.status(200).json({ success: true, updated: notification.count });
  }

  if (action === 'mark-all-read') {
    // Mark all notifications as read
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return res.status(200).json({ success: true, updated: result.count });
  }

  if (action === 'delete' && notificationId) {
    // Delete single notification
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    return res.status(200).json({ success: true });
  }

  if (action === 'delete-all-read') {
    // Delete all read notifications
    const result = await prisma.notification.deleteMany({
      where: { userId, read: true },
    });
    return res.status(200).json({ success: true, deleted: result.count });
  }

  return res.status(400).json({ error: 'Azione non valida' });
}
