import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'projcontest-encryption-key-32ch'; // 32 chars for AES-256

// Encryption helpers
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

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

// Settings keys that should be encrypted
const SENSITIVE_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_SECRET',
];

// All configurable settings
const ALLOWED_SETTINGS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_ENABLED',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_ENABLED',
  'PAYPAL_SANDBOX_MODE',
  'PLATFORM_FEE_PERCENT',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify admin auth
  const token = getTokenFromHeader(req.headers.authorization || null);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Verify user is admin
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  switch (req.method) {
    case 'GET':
      return getSettings(req, res);
    case 'PUT':
      return updateSettings(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSettings(req: VercelRequest, res: VercelResponse) {
  try {
    const settings = await prisma.setting.findMany();

    // Build settings object, masking sensitive values
    const settingsMap: Record<string, any> = {};

    for (const setting of settings) {
      if (setting.encrypted) {
        // For sensitive keys, show masked value
        const decrypted = decrypt(setting.value);
        settingsMap[setting.key] = {
          value: decrypted ? '••••••••' + decrypted.slice(-4) : '',
          hasValue: !!decrypted,
        };
      } else {
        settingsMap[setting.key] = {
          value: setting.value,
          hasValue: true,
        };
      }
    }

    // Include all allowed settings (even if not set)
    for (const key of ALLOWED_SETTINGS) {
      if (!settingsMap[key]) {
        settingsMap[key] = { value: '', hasValue: false };
      }
    }

    return res.status(200).json({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateSettings(req: VercelRequest, res: VercelResponse) {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    const updates: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      // Only allow whitelisted settings
      if (!ALLOWED_SETTINGS.includes(key)) {
        continue;
      }

      // Skip empty values for sensitive keys (means "keep existing")
      if (SENSITIVE_KEYS.includes(key) && !value) {
        continue;
      }

      const shouldEncrypt = SENSITIVE_KEYS.includes(key);
      const storedValue = shouldEncrypt ? encrypt(value as string) : (value as string);

      await prisma.setting.upsert({
        where: { key },
        update: {
          value: storedValue,
          encrypted: shouldEncrypt,
        },
        create: {
          key,
          value: storedValue,
          encrypted: shouldEncrypt,
        },
      });

      updates.push(key);
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updates.length} settings`,
      updated: updates,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to get a setting value (for use in other API endpoints)
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) return null;

    if (setting.encrypted) {
      return decrypt(setting.value);
    }
    return setting.value;
  } catch {
    return null;
  }
}

// Helper to get multiple settings at once
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  for (const key of keys) {
    result[key] = await getSetting(key);
  }

  return result;
}
