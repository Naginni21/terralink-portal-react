import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import { OAuth2Client } from 'google-auth-library';
import { getGoogleClientId, getAllowedDomains, getAdminEmails, AUTH_CONFIG } from './config.js';

/**
 * Google OAuth Callback Handler
 * Exchanges authorization code for tokens using client secret
 * This is the SECURE way to handle OAuth
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'https://terralink-portal.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Get Google OAuth credentials
    const googleClientId = getGoogleClientId();
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Use the redirect_uri from the request or default to production URL
    const finalRedirectUri = redirect_uri || 'https://terralink-portal.vercel.app/signin';
    
    console.log('OAuth Exchange Debug:', {
      codePrefix: code.substring(0, 20) + '...',
      redirectUri: finalRedirectUri,
      clientIdPrefix: googleClientId.substring(0, 20) + '...',
      hasClientSecret: !!googleClientSecret
    });

    // Initialize OAuth2 client with CLIENT SECRET
    const oauth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      finalRedirectUri
    );

    // Exchange authorization code for tokens
    // This is where the CLIENT SECRET is used - server-side only!
    let tokens;
    try {
      const { tokens: exchangedTokens } = await oauth2Client.getToken(code);
      tokens = exchangedTokens;
    } catch (error: any) {
      console.error('Failed to exchange authorization code:', {
        error: error.message,
        code: error.code,
        details: error.response?.data || error
      });
      
      // Provide more specific error message
      let errorMessage = 'Invalid authorization code';
      if (error.message?.includes('invalid_grant')) {
        errorMessage = 'Authorization code expired or already used';
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'Redirect URI mismatch - check Google Console configuration';
      }
      
      return res.status(401).json({ 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          originalError: error.message,
          redirectUri: finalRedirectUri
        } : undefined
      });
    }

    if (!tokens.id_token) {
      return res.status(401).json({ error: 'No ID token received' });
    }

    // Verify and decode the ID token
    let ticket;
    try {
      ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: googleClientId
      });
    } catch (error) {
      console.error('Failed to verify ID token:', error);
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Extract user information
    const googleUser = {
      sub: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || '',
      email_verified: payload.email_verified || false
    };

    // Verify email is verified
    if (!googleUser.email_verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check blacklist
    try {
      const blacklisted = await kv.get(`blacklist:${googleUser.email}`);
      if (blacklisted) {
        await logFailedLogin(googleUser.email, 'blacklisted', req);
        return res.status(403).json({ error: 'Access denied' });
      }
    } catch (kvError) {
      console.log('KV not configured, skipping blacklist check');
    }

    // Check allowed domains
    const allowedDomains = getAllowedDomains();
    const userDomain = googleUser.email.split('@')[1]?.toLowerCase();
    
    if (!userDomain || !allowedDomains.includes(userDomain)) {
      try {
        await logFailedLogin(googleUser.email, 'invalid_domain', req);
      } catch (error) {
        console.log('Could not log failed login');
      }
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user role
    const adminEmails = getAdminEmails();
    const userRole = adminEmails.includes(googleUser.email.toLowerCase()) ? 'admin' : 'default';

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

    // Store session in KV with refresh token if available
    const sessionData = {
      user: {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        role: userRole,
        image: googleUser.picture
      },
      refreshToken: tokens.refresh_token, // Store refresh token securely
      accessToken: tokens.access_token,   // Store access token for API calls
      idToken: tokens.id_token,
      createdAt: Date.now(),
      lastValidated: Date.now(),
      lastActivity: Date.now(),
      validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000),
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
    console.error('Google callback error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed'
    });
  }
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
      userAgent: req.headers['user-agent'],
      method: 'google_oauth_code_flow'
    };

    await kv.lpush('audit:logins', JSON.stringify(logEntry));
    await kv.ltrim('audit:logins', 0, 9999);
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
      userAgent: req.headers['user-agent'],
      method: 'google_oauth_code_flow'
    };

    await kv.lpush('audit:logins', JSON.stringify(logEntry));
    await kv.ltrim('audit:logins', 0, 9999);
  } catch (error) {
    console.log('Could not write to audit log');
  }
}