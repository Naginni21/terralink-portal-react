import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import { OAuth2Client } from 'google-auth-library';
import { validateEnvironment, getAllowedDomains, getAdminEmails, AUTH_CONFIG } from './config';

/**
 * Login endpoint - Authenticates users with Google OAuth
 * Creates 30-day sessions for the portal
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validate environment on each request
  const envValidation = validateEnvironment();
  if (!envValidation.valid) {
    console.error('Environment validation failed:', envValidation.errors);
    return res.status(500).json({ error: 'Server configuration error' });
  }

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

    // Initialize Google OAuth2 client
    // For ID token verification, we only need the Client ID
    const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

    // Verify Google token
    let googleUser;
    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.VITE_GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: 'Invalid Google token' });
      }
      
      googleUser = {
        sub: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        email_verified: payload.email_verified || false,
        exp: payload.exp || 0
      };
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check email verification
    if (!googleUser.email_verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check blacklist first (skip if KV not configured)
    try {
      const blacklisted = await kv.get(`blacklist:${googleUser.email}`);
      if (blacklisted) {
        await logFailedLogin(googleUser.email, 'blacklisted', req);
        return res.status(403).json({ 
          error: 'Access denied'
        });
      }
    } catch (kvError) {
      console.log('KV not configured, skipping blacklist check');
    }

    // Check allowed domains
    const allowedDomains = getAllowedDomains();
    const userDomain = googleUser.email.split('@')[1].toLowerCase();
    
    if (!allowedDomains.includes(userDomain)) {
      try {
        await logFailedLogin(googleUser.email, 'invalid_domain', req);
      } catch (error) {
        console.log('Could not log failed login');
      }
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user role from constants (you'll need to maintain this list)
    const userRole = getUserRole(googleUser.email);

    // Ensure JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create 30-day session JWT
    const sessionToken = jwt.sign(
      { 
        userId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        role: userRole,
        picture: googleUser.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: `${AUTH_CONFIG.SESSION_DURATION_DAYS}d` }
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

    // Store session in KV if available
    try {
      await kv.set(`session:${googleUser.sub}`, sessionData, {
        ex: 30 * 24 * 60 * 60 // 30 days TTL
      });
    } catch (kvError) {
      console.log('KV not configured, session not persisted');
    }

    // Audit log
    try {
      await logSuccessfulLogin(googleUser.email, req);
    } catch (logError) {
      console.log('Could not log successful login');
    }

    // Return session token and user data
    return res.status(200).json({ 
      sessionToken,
      user: sessionData.user,
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed'
    });
  }
}

/**
 * Get user role based on email
 */
type UserRole = 'admin' | 'customer' | 'default';

function getUserRole(email: string): UserRole {
  // Check if user is in admin list
  const adminEmails = getAdminEmails();
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin';
  }
  
  // Default role mapping (can be extended)
  const roleMap: Record<string, UserRole> = {
    // Add specific customer emails here if needed
    // 'customer@terralink.cl': 'customer',
  };
  
  return roleMap[email] || 'default'; // Default role
}

/**
 * Log successful login
 */
async function logSuccessfulLogin(email: string, req: VercelRequest) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'LOGIN_SUCCESS',
      email,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    await kv.lpush('audit:logins', JSON.stringify(logEntry));
    await kv.ltrim('audit:logins', 0, 9999); // Keep last 10,000 entries
  } catch (error) {
    console.log('Could not write to audit log');
  }
}

/**
 * Log failed login attempt
 */
async function logFailedLogin(email: string, reason: string, req: VercelRequest) {
  try {
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
  } catch (error) {
    console.log('Could not write to audit log');
  }
}