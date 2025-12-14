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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    return getProfile(payload.userId, res);
  } else if (req.method === 'PUT') {
    return updateProfile(payload.userId, req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getProfile(userId: string, res: VercelResponse) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            contests: true,
            proposals: true,
            practiceRequests: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateProfile(userId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { name, avatarUrl, bio, portfolio, phone, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (phone !== undefined) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
