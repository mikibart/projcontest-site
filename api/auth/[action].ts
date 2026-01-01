import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'register':
      return handleRegister(req, res);
    case 'refresh':
      return handleRefresh(req, res);
    default:
      return res.status(404).json({ error: 'Unknown action' });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  try {
    const { email, password, name, role = 'CLIENT' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role.toUpperCase(),
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const accessToken = jwt.sign(
      { userId: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
