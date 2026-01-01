import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify auth
    const token = getTokenFromHeader(req.headers.authorization || null);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const filename = req.query.filename as string;
    const contestId = req.query.contestId as string | undefined;
    const proposalId = req.query.proposalId as string | undefined;
    const practiceId = req.query.practiceId as string | undefined;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Get content type from headers
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    // Read the body as a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Upload to Vercel Blob
    const blob = await put(filename, body, {
      access: 'public',
      contentType,
    });

    // Save file record to database
    const file = await prisma.file.create({
      data: {
        filename: blob.pathname,
        originalName: filename,
        mimeType: contentType,
        size: body.length,
        url: blob.url,
        userId: payload.userId,
        contestId: contestId || null,
        proposalId: proposalId || null,
        practiceId: practiceId || null,
      },
    });

    return res.status(200).json({
      success: true,
      file: {
        id: file.id,
        filename: file.originalName,
        url: file.url,
        size: file.size,
        mimeType: file.mimeType,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
}
