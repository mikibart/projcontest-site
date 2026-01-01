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
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Portfolio API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Fetch portfolio projects
async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { userId, projectId, category, featured, page = '1', limit = '20' } = req.query;

  // Get single project
  if (projectId) {
    const project = await prisma.portfolioProject.findUnique({
      where: { id: projectId.toString() },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        contest: { select: { id: true, title: true, budget: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' });
    }

    return res.status(200).json(project);
  }

  // Build filter
  const where: any = {};
  if (userId) where.userId = userId.toString();
  if (category) where.category = category.toString().toUpperCase();
  if (featured === 'true') where.featured = true;

  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  const [projects, total] = await Promise.all([
    prisma.portfolioProject.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: parseInt(limit.toString()),
    }),
    prisma.portfolioProject.count({ where }),
  ]);

  return res.status(200).json({
    projects,
    total,
    page: parseInt(page.toString()),
    totalPages: Math.ceil(total / parseInt(limit.toString())),
  });
}

// POST: Create a new portfolio project
async function handlePost(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  // Verify user is an architect
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (user?.role !== 'ARCHITECT' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo gli architetti possono creare progetti portfolio' });
  }

  const {
    title,
    description,
    category,
    location,
    year,
    imageUrl,
    images,
    tags,
    featured,
    contestId,
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Titolo e categoria sono obbligatori' });
  }

  // If linking to contest, verify it's a won contest
  if (contestId) {
    const proposal = await prisma.proposal.findFirst({
      where: {
        contestId,
        architectId: payload.userId,
        status: 'WINNER',
      },
    });

    if (!proposal) {
      return res.status(400).json({ error: 'Puoi linkare solo concorsi che hai vinto' });
    }
  }

  const project = await prisma.portfolioProject.create({
    data: {
      title,
      description: description || null,
      category: category.toUpperCase(),
      location: location || null,
      year: year ? parseInt(year) : null,
      imageUrl: imageUrl || null,
      images: images || [],
      tags: tags || [],
      featured: featured || false,
      userId: payload.userId,
      contestId: contestId || null,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return res.status(201).json(project);
}

// PUT: Update a portfolio project
async function handlePut(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { projectId, ...updateData } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'ID progetto richiesto' });
  }

  // Verify ownership
  const existing = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Progetto non trovato' });
  }

  if (existing.userId !== payload.userId) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }

  // Build update object
  const data: any = {};
  if (updateData.title !== undefined) data.title = updateData.title;
  if (updateData.description !== undefined) data.description = updateData.description || null;
  if (updateData.category !== undefined) data.category = updateData.category.toUpperCase();
  if (updateData.location !== undefined) data.location = updateData.location || null;
  if (updateData.year !== undefined) data.year = updateData.year ? parseInt(updateData.year) : null;
  if (updateData.imageUrl !== undefined) data.imageUrl = updateData.imageUrl || null;
  if (updateData.images !== undefined) data.images = updateData.images || [];
  if (updateData.tags !== undefined) data.tags = updateData.tags || [];
  if (updateData.featured !== undefined) data.featured = updateData.featured;

  const project = await prisma.portfolioProject.update({
    where: { id: projectId },
    data,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return res.status(200).json(project);
}

// DELETE: Delete a portfolio project
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Autenticazione richiesta' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'ID progetto richiesto' });
  }

  // Verify ownership
  const existing = await prisma.portfolioProject.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Progetto non trovato' });
  }

  if (existing.userId !== payload.userId) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }

  await prisma.portfolioProject.delete({ where: { id: projectId } });

  return res.status(200).json({ success: true });
}
