import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';

/**
 * Admin revocation endpoint
 * Allows admins to immediately revoke access for any user
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { emailToRevoke, reason } = req.body;

    // Get admin token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const adminToken = authHeader.substring(7);

    // Verify admin token
    let adminUser;
    try {
      adminUser = jwt.verify(
        adminToken,
        process.env.JWT_SECRET || 'dev-secret-change-in-production'
      ) as any;
    } catch {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    // Check if user is admin
    if (adminUser.role !== 'admin') {
      await logRevocationAttempt(adminUser.email, emailToRevoke, false, 'not_admin');
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate email to revoke
    if (!emailToRevoke || !emailToRevoke.endsWith('@terralink.cl')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Add to blacklist
    await kv.set(`blacklist:${emailToRevoke}`, {
      reason: reason || 'Access revoked by admin',
      revokedBy: adminUser.email,
      revokedAt: Date.now()
    });

    // Find and revoke all active sessions for this user
    // Note: In production, you'd want to maintain an index of email->userId mappings
    const sessionsRevoked = await revokeUserSessions(emailToRevoke, adminUser.email);

    // Audit log
    await logRevocationAttempt(
      adminUser.email,
      emailToRevoke,
      true,
      `revoked_${sessionsRevoked}_sessions`
    );

    return res.status(200).json({
      success: true,
      message: `Access revoked for ${emailToRevoke}`,
      sessionsRevoked
    });

  } catch (error: any) {
    console.error('Revocation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Revoke all sessions for a user
 */
async function revokeUserSessions(email: string, revokedBy: string): Promise<number> {
  let count = 0;
  
  // In production, you'd maintain an email->userId index
  // For now, we'll scan through recent sessions (this is not optimal for large scale)
  const keys = await kv.keys('session:*');
  
  for (const key of keys) {
    const session = await kv.get(key);
    if (session && (session as any).user?.email === email) {
      // Mark session as revoked
      await kv.set(key, {
        ...(session as any),
        status: 'revoked',
        revokedBy,
        revokedAt: Date.now(),
        revokedReason: 'admin_revocation'
      });
      count++;
    }
  }
  
  return count;
}

/**
 * Log revocation attempts
 */
async function logRevocationAttempt(
  adminEmail: string,
  targetEmail: string,
  success: boolean,
  action: string
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'REVOCATION',
    adminEmail,
    targetEmail,
    success,
    details: action
  };

  await kv.lpush('audit:revocations', JSON.stringify(logEntry));
  await kv.ltrim('audit:revocations', 0, 999); // Keep last 1000 revocation attempts
}