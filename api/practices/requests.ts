import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma';
import { verifyAccessToken, getTokenFromHeader } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getRequests(req, res);
  } else if (req.method === 'POST') {
    return createRequest(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getRequests(req: VercelRequest, res: VercelResponse) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const requests = await prisma.practiceRequest.findMany({
      where: { userId: payload.userId },
      include: {
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      type,
      propertyType,
      size,
      location,
      isVincolato = false,
      hasOldPermits = false,
      interventionDetails,
      contactName,
      contactEmail,
      contactPhone,
      fileIds = [],
    } = req.body;

    if (!type || !propertyType || !location || !contactName || !contactEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user id if authenticated
    let userId = null;
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    const request = await prisma.practiceRequest.create({
      data: {
        type: type.toUpperCase(),
        propertyType,
        size: size ? parseFloat(size) : null,
        location,
        isVincolato,
        hasOldPermits,
        interventionDetails,
        contactName,
        contactEmail,
        contactPhone,
        userId,
        files: fileIds.length > 0 ? {
          connect: fileIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        files: true,
      },
    });

    return res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
