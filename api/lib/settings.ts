import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'projcontest-encryption-key-32ch';

function decrypt(text: string): string {
  try {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) return '';
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

// Cache settings in memory (refresh every 5 minutes)
let settingsCache: Record<string, string> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function refreshCache(): Promise<void> {
  try {
    const settings = await prisma.setting.findMany();
    const newCache: Record<string, string> = {};

    for (const setting of settings) {
      if (setting.encrypted) {
        newCache[setting.key] = decrypt(setting.value);
      } else {
        newCache[setting.key] = setting.value;
      }
    }

    settingsCache = newCache;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error('Error refreshing settings cache:', error);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  // Check if cache needs refresh
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    await refreshCache();
  }

  // Return from cache or fallback to environment variable
  const value = settingsCache[key];
  if (value) return value;

  // Fallback to environment variable
  return process.env[key] || null;
}

export async function getPaymentSettings(): Promise<{
  stripe: {
    enabled: boolean;
    secretKey: string | null;
    webhookSecret: string | null;
  };
  paypal: {
    enabled: boolean;
    clientId: string | null;
    clientSecret: string | null;
    sandboxMode: boolean;
  };
  platformFeePercent: number;
}> {
  // Refresh cache if needed
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    await refreshCache();
  }

  return {
    stripe: {
      enabled: (settingsCache['STRIPE_ENABLED'] || 'true') === 'true',
      secretKey: settingsCache['STRIPE_SECRET_KEY'] || process.env.STRIPE_SECRET_KEY || null,
      webhookSecret: settingsCache['STRIPE_WEBHOOK_SECRET'] || process.env.STRIPE_WEBHOOK_SECRET || null,
    },
    paypal: {
      enabled: (settingsCache['PAYPAL_ENABLED'] || 'true') === 'true',
      clientId: settingsCache['PAYPAL_CLIENT_ID'] || process.env.PAYPAL_CLIENT_ID || null,
      clientSecret: settingsCache['PAYPAL_CLIENT_SECRET'] || process.env.PAYPAL_CLIENT_SECRET || null,
      sandboxMode: (settingsCache['PAYPAL_SANDBOX_MODE'] || 'false') === 'true',
    },
    platformFeePercent: parseFloat(settingsCache['PLATFORM_FEE_PERCENT'] || '5'),
  };
}
