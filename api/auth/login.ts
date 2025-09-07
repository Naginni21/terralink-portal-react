import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import { jwtDecode } from 'jwt-decode';

/**
 * Login endpoint - Authenticates users with Google OAuth
 * Creates 30-day sessions for the portal
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add CORS headers for portal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token required' });
    }

    // Decode and verify Google token
    interface GoogleTokenPayload {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: boolean;
      exp: number;
      [key: string]: unknown;
    }

    const googleUser = jwtDecode<GoogleTokenPayload>(googleToken);

    // Check if token is expired
    if (googleUser.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Google token expired' });
    }

    // Check email verification
    if (!googleUser.email_verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check blacklist first
    const blacklisted = await kv.get(`blacklist:${googleUser.email}`);
    if (blacklisted) {
      await logFailedLogin(googleUser.email, 'blacklisted', req);
      return res.status(403).json({ 
        error: 'Access revoked',
        reason: (blacklisted as any).reason 
      });
    }

    // Check @terralink.cl domain
    if (!googleUser.email.endsWith('@terralink.cl')) {
      await logFailedLogin(googleUser.email, 'invalid_domain', req);
      return res.status(403).json({ error: 'Solo se permiten correos @terralink.cl' });
    }

    // Get user role from constants (you'll need to maintain this list)
    const userRole = getUserRole(googleUser.email);

    // Create 30-day session JWT
    const sessionToken = jwt.sign(
      { 
        userId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        role: userRole,
        picture: googleUser.picture
      },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '30d' }
    );

    // Store session in KV with Google token for revalidation
    const sessionData = {
      user: {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        role: userRole,
        image: googleUser.picture
      },
      googleToken: googleToken,
      createdAt: Date.now(),
      lastValidated: Date.now(),
      lastActivity: Date.now(),
      validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'active'
    };

    await kv.set(`session:${googleUser.sub}`, sessionData, {
      ex: 30 * 24 * 60 * 60 // 30 days TTL
    });

    // Audit log
    await logSuccessfulLogin(googleUser.email, req);

    // Return session token and user data
    return res.status(200).json({ 
      sessionToken,
      user: sessionData.user,
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get user role based on email
 */
type UserRole = 'admin' | 'operaciones' | 'ventas' | 'usuario';

function getUserRole(email: string): UserRole {
  // This matches the USER_DATABASE from constants.ts
  const roleMap: Record<string, UserRole> = {
    'felipe.silva@terralink.cl': 'admin',
    'admin@terralink.cl': 'admin',
    'operaciones@terralink.cl': 'operaciones',
    'ventas@terralink.cl': 'ventas'
  };
  
  return roleMap[email] || 'usuario'; // Default role
}

/**
 * Log successful login
 */
async function logSuccessfulLogin(email: string, req: VercelRequest) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'LOGIN_SUCCESS',
    email,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  await kv.lpush('audit:logins', JSON.stringify(logEntry));
  await kv.ltrim('audit:logins', 0, 9999); // Keep last 10,000 entries
}

/**
 * Log failed login attempt
 */
async function logFailedLogin(email: string, reason: string, req: VercelRequest) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'LOGIN_FAILED',
    email,
    reason,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  await kv.lpush('audit:logins', JSON.stringify(logEntry));
  await kv.ltrim('audit:logins', 0, 9999);
}