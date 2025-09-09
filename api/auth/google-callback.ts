import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { getGoogleClientId, getAllowedDomains, getAdminEmails } from './config.js';

/**
 * Google OAuth Callback Handler
 * Handles the POST redirect from Google Sign-In when using ux_mode: 'redirect'
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // This endpoint only accepts POST from Google OAuth
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Google sends the credential in the body
    const { credential } = req.body;

    if (!credential) {
      // If no credential, redirect to sign-in page with error
      return res.redirect(302, '/signin?error=no_credential');
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
      return res.redirect(302, '/signin?error=invalid_credential');
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.redirect(302, '/signin?error=invalid_payload');
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
      return res.redirect(302, '/signin?error=email_not_verified');
    }

    // Check allowed domains
    const allowedDomains = getAllowedDomains();
    const userDomain = user.email.split('@')[1]?.toLowerCase();
    
    if (!userDomain || !allowedDomains.includes(userDomain)) {
      console.log(`Access denied for domain: ${userDomain}`);
      return res.redirect(302, '/signin?error=domain_not_allowed');
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
        method: 'google_callback'
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

    // Redirect to home page after successful login
    return res.redirect(302, '/');

  } catch (error: any) {
    console.error('Sign-in callback error:', error);
    return res.redirect(302, '/signin?error=authentication_failed');
  }
}