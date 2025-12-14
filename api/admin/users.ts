import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

  if (req.method === 'GET') {
    return getUsers(req, res);
  } else if (req.method === 'PUT') {
    return updateUser(req, res);
  } else if (req.method === 'DELETE') {
    return deleteUser(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUsers(req: VercelRequest, res: VercelResponse) {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;

    const where: any = {};

    if (role && role !== 'all') {
      where.role = role.toString().toUpperCase();
    }

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
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              contests: true,
              proposals: true,
              practiceRequests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit.toString()),
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      total,
      page: parseInt(page.toString()),
      totalPages: Math.ceil(total / parseInt(limit.toString())),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUser(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId, role, name, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const updateData: any = {};
    if (role) updateData.role = role.toUpperCase();
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
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

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
