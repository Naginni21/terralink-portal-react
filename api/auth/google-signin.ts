import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { getGoogleClientId, getAllowedDomains, getAdminEmails } from './config.js';

/**
 * Google Sign-In Handler
 * Accepts Google ID tokens directly (no authorization code exchange)
 * Creates server-side sessions with HttpOnly cookies
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  const origin = req.headers.origin || 'https://terralink-portal.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Initialize OAuth2 client
    const googleClientId = getGoogleClientId();
    const client = new OAuth2Client(googleClientId);

    // Verify the ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId
      });
    } catch (error) {
      console.error('Failed to verify ID token:', error);
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Extract user info
    const user = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || '',
      email_verified: payload.email_verified || false
    };

    // Verify email is verified
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check allowed domains
    const allowedDomains = getAllowedDomains();
    const userDomain = user.email.split('@')[1]?.toLowerCase();
    
    if (!userDomain || !allowedDomains.includes(userDomain)) {
      console.log(`Access denied for domain: ${userDomain}`);
      return res.status(403).json({ error: 'Access denied - domain not allowed' });
    }

    // Check if user is admin
    const adminEmails = getAdminEmails();
    const role = adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'user';

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Create session data
    const sessionData = {
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role
      },
      csrfToken,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Store session in KV
    try {
      await kv.set(
        `session:${sessionId}`,
        sessionData,
        { ex: 30 * 24 * 60 * 60 } // 30 days TTL
      );
      
      // Also store user sessions list for management
      await kv.sadd(`user:sessions:${user.email}`, sessionId);
      
      // Log successful login
      await kv.lpush('audit:logins', JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'LOGIN_SUCCESS',
        email: user.email,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        method: 'google_signin'
      }));
      await kv.ltrim('audit:logins', 0, 999); // Keep last 1000 entries
    } catch (kvError) {
      console.error('KV storage error:', kvError);
      // Continue without KV if not available (development)
    }

    // Set HttpOnly session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `terralink_session=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      `Max-Age=${30 * 24 * 60 * 60}`, // 30 days
      'Path=/'
    ];

    if (isProduction) {
      cookieOptions.push('Domain=.vercel.app');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    // Return user data and CSRF token
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role
      },
      csrfToken
    });

  } catch (error: any) {
    console.error('Sign-in error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}