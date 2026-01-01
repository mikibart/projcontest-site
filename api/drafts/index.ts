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
      case 'DELETE':
        return handleDelete(req, res, payload.userId);
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error) {
    console.error('Drafts API error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

// GET: Fetch user's drafts
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { draftId } = req.query;

  if (draftId) {
    // Get single draft
    const draft = await prisma.draftContest.findFirst({
      where: { id: draftId.toString(), userId },
    });

    if (!draft) {
      return res.status(404).json({ error: 'Bozza non trovata' });
    }

    return res.status(200).json(draft);
  }

  // Get all drafts for user
  const drafts = await prisma.draftContest.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return res.status(200).json({ drafts });
}

// POST: Create a new draft
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    title,
    description,
    brief,
    location,
    category,
    budget,
    deadline,
    imageUrl,
    mustHaves,
    constraints,
    deliverables,
    styles,
    currentStep,
    formData,
  } = req.body;

  const draft = await prisma.draftContest.create({
    data: {
      userId,
      title: title || null,
      description: description || null,
      brief: brief || null,
      location: location || null,
      category: category || null,
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline ? new Date(deadline) : null,
      imageUrl: imageUrl || null,
      mustHaves: mustHaves || [],
      constraints: constraints || [],
      deliverables: deliverables || [],
      styles: styles || [],
      currentStep: currentStep || 1,
      formData: formData || null,
    },
  });

  return res.status(201).json(draft);
}

// PUT: Update an existing draft
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { draftId, ...updateData } = req.body;

  if (!draftId) {
    return res.status(400).json({ error: 'ID bozza richiesto' });
  }

  // Verify ownership
  const existing = await prisma.draftContest.findFirst({
    where: { id: draftId, userId },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Bozza non trovata' });
  }

  // Build update object
  const data: any = {};
  if (updateData.title !== undefined) data.title = updateData.title || null;
  if (updateData.description !== undefined) data.description = updateData.description || null;
  if (updateData.brief !== undefined) data.brief = updateData.brief || null;
  if (updateData.location !== undefined) data.location = updateData.location || null;
  if (updateData.category !== undefined) data.category = updateData.category || null;
  if (updateData.budget !== undefined) data.budget = updateData.budget ? parseFloat(updateData.budget) : null;
  if (updateData.deadline !== undefined) data.deadline = updateData.deadline ? new Date(updateData.deadline) : null;
  if (updateData.imageUrl !== undefined) data.imageUrl = updateData.imageUrl || null;
  if (updateData.mustHaves !== undefined) data.mustHaves = updateData.mustHaves || [];
  if (updateData.constraints !== undefined) data.constraints = updateData.constraints || [];
  if (updateData.deliverables !== undefined) data.deliverables = updateData.deliverables || [];
  if (updateData.styles !== undefined) data.styles = updateData.styles || [];
  if (updateData.currentStep !== undefined) data.currentStep = updateData.currentStep;
  if (updateData.formData !== undefined) data.formData = updateData.formData;

  const draft = await prisma.draftContest.update({
    where: { id: draftId },
    data,
  });

  return res.status(200).json(draft);
}

// DELETE: Delete a draft
async function handleDelete(req: VercelRequest, res: VercelResponse, userId: string) {
  const { draftId } = req.body;

  if (!draftId) {
    return res.status(400).json({ error: 'ID bozza richiesto' });
  }

  // Verify ownership and delete
  const result = await prisma.draftContest.deleteMany({
    where: { id: draftId, userId },
  });

  if (result.count === 0) {
    return res.status(404).json({ error: 'Bozza non trovata' });
  }

  return res.status(200).json({ success: true });
}
