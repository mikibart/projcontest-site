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
      case 'POST':
        return handlePost(req, res, payload.userId);
      case 'PUT':
        return handlePut(req, res, payload.userId);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Fetch conversations or messages
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, conversationWith, contestId, proposalId, page = '1', limit = '50' } = req.query;

  if (action === 'conversations') {
    // Get list of unique conversations (grouped by other user)
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: {
        receiverId: true,
        receiver: { select: { id: true, name: true, avatarUrl: true, role: true } },
        contestId: true,
        contest: { select: { id: true, title: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: {
        senderId: true,
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        contestId: true,
        contest: { select: { id: true, title: true } },
        createdAt: true,
        read: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build unique conversations
    const conversationsMap = new Map<string, any>();

    sentMessages.forEach(msg => {
      const key = `${msg.receiverId}-${msg.contestId || 'general'}`;
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: msg.receiver,
          contest: msg.contest,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }
    });

    receivedMessages.forEach(msg => {
      const key = `${msg.senderId}-${msg.contestId || 'general'}`;
      const existing = conversationsMap.get(key);
      if (!existing || msg.createdAt > existing.lastMessageAt) {
        conversationsMap.set(key, {
          user: msg.sender,
          contest: msg.contest,
          lastMessageAt: msg.createdAt,
          unreadCount: (existing?.unreadCount || 0) + (!msg.read ? 1 : 0),
        });
      } else if (!msg.read) {
        existing.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    return res.status(200).json({ conversations });
  }

  // Get messages with specific user
  if (!conversationWith) {
    return res.status(400).json({ error: 'Specificare conversationWith' });
  }

  const where: any = {
    OR: [
      { senderId: userId, receiverId: conversationWith.toString() },
      { senderId: conversationWith.toString(), receiverId: userId },
    ],
  };

  if (contestId) where.contestId = contestId.toString();
  if (proposalId) where.proposalId = proposalId.toString();

  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
        contest: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: parseInt(limit.toString()),
    }),
    prisma.message.count({ where }),
  ]);

  // Mark received messages as read
  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      senderId: conversationWith.toString(),
      read: false,
    },
    data: { read: true },
  });

  return res.status(200).json({
    messages,
    total,
    page: parseInt(page.toString()),
    totalPages: Math.ceil(total / parseInt(limit.toString())),
  });
}

// POST: Send a new message
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { receiverId, content, contestId, proposalId } = req.body;

  if (!receiverId || !content?.trim()) {
    return res.status(400).json({ error: 'Destinatario e contenuto sono obbligatori' });
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true },
  });

  if (!receiver) {
    return res.status(404).json({ error: 'Destinatario non trovato' });
  }

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Create message
  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: userId,
      receiverId,
      contestId: contestId || null,
      proposalId: proposalId || null,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'MESSAGE_NEW',
      title: 'Nuovo messaggio',
      message: `${sender?.name || 'Un utente'} ti ha inviato un messaggio`,
      link: `/messages?user=${userId}`,
    },
  });

  return res.status(201).json(message);
}

// PUT: Mark messages as read
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { messageIds, senderId } = req.body;

  if (messageIds && Array.isArray(messageIds)) {
    // Mark specific messages as read
    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: userId,
      },
      data: { read: true },
    });
    return res.status(200).json({ success: true, updated: result.count });
  }

  if (senderId) {
    // Mark all messages from sender as read
    const result = await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });
    return res.status(200).json({ success: true, updated: result.count });
  }

  return res.status(400).json({ error: 'Specificare messageIds o senderId' });
}
