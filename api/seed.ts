import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests with a secret key for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { secret } = req.body;
  if (secret !== 'projcontest-seed-2024') {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const users = [
      {
        email: 'admin@demo.it',
        name: 'Admin Demo',
        role: 'ADMIN' as const,
        password: hashedPassword,
      },
      {
        email: 'cliente@demo.it',
        name: 'Cliente Demo',
        role: 'CLIENT' as const,
        password: hashedPassword,
      },
      {
        email: 'architetto@demo.it',
        name: 'Architetto Demo',
        role: 'ARCHITECT' as const,
        password: hashedPassword,
        bio: 'Architetto con 10 anni di esperienza in progetti residenziali e commerciali.',
        portfolio: 'https://portfolio.demo.it',
      },
      {
        email: 'ingegnere@demo.it',
        name: 'Ingegnere Demo',
        role: 'ENGINEER' as const,
        password: hashedPassword,
        bio: 'Ingegnere strutturista specializzato in calcoli sismici e pratiche edilizie.',
      },
    ];

    const createdUsers = [];

    for (const userData of users) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        createdUsers.push({ ...existing, status: 'already_exists' });
      } else {
        const user = await prisma.user.create({
          data: userData,
          select: { id: true, email: true, name: true, role: true },
        });
        createdUsers.push({ ...user, status: 'created' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Demo users created successfully',
      users: createdUsers,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Failed to seed database', details: String(error) });
  }
}
