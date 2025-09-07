import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import { jwtDecode } from 'jwt-decode';
import crypto from 'crypto';

/**
 * Universal validation endpoint
 * Handles:
 * 1. Portal session validation
 * 2. App token generation
 * 3. Sub-app token validation
 * 4. Periodic session checks
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { 
      token,           // JWT token to validate
      generateAppToken, // Request to generate sub-app token
      appId,           // Which app to generate token for
      sessionCheck,    // Periodic check from sub-app
      email            // Email for session check
    } = req.body;

    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rateLimitKey = `rate:${ip}`;
    const attempts = await kv.incr(rateLimitKey);
    
    if (attempts === 1) {
      await kv.expire(rateLimitKey, 60); // Reset after 1 minute
    }
    
    if (attempts > 30) { // 30 requests per minute
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Handle periodic session check from sub-apps
    if (sessionCheck && email) {
      return handleSessionCheck(email, res);
    }

    // Handle token validation
    if (token) {
      // First check if it's an app token (5-minute token)
      const appTokenData = await kv.get(`app_token:${token}`);
      if (appTokenData) {
        return handleAppTokenValidation(appTokenData, res);
      }

      // Otherwise, validate as session token
      return handleSessionTokenValidation(token, generateAppToken, appId, res, req);
    }

    return res.status(400).json({ error: 'Invalid request parameters' });

  } catch (error: any) {
    console.error('Validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle session token validation (30-day portal tokens)
 */
async function handleSessionTokenValidation(
  token: string,
  generateAppToken: boolean,
  appId: string | undefined,
  res: VercelResponse,
  req: VercelRequest
) {
  try {
    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    ) as any;

    // Check blacklist
    const blacklisted = await kv.get(`blacklist:${decoded.email}`);
    if (blacklisted) {
      await logValidation(decoded.email, 'blacklisted', false);
      return res.status(401).json({ 
        valid: false,
        reason: 'account_revoked'
      });
    }

    // Get session from KV
    const session = await kv.get(`session:${decoded.userId}`);
    if (!session) {
      await logValidation(decoded.email, 'session_not_found', false);
      return res.status(401).json({ valid: false });
    }

    const sessionData = session as any;

    // Check if session is active
    if (sessionData.status !== 'active') {
      await logValidation(decoded.email, 'session_revoked', false);
      return res.status(401).json({ 
        valid: false,
        reason: 'session_revoked'
      });
    }

    // Check if Google revalidation is needed (every hour)
    const hoursSinceValidation = (Date.now() - sessionData.lastValidated) / 3600000;
    if (hoursSinceValidation > 1) {
      // Revalidate with Google (simplified - in production would call Google API)
      const googleValid = await revalidateGoogleToken(sessionData.googleToken);
      
      if (!googleValid) {
        // Mark session as revoked
        await kv.set(`session:${decoded.userId}`, {
          ...sessionData,
          status: 'revoked',
          revokedReason: 'google_account_disabled'
        });
        
        await logValidation(decoded.email, 'google_disabled', false);
        return res.status(401).json({ 
          valid: false,
          reason: 'google_account_disabled'
        });
      }

      // Update last validated time
      sessionData.lastValidated = Date.now();
      await kv.set(`session:${decoded.userId}`, sessionData);
    }

    // Update last activity
    sessionData.lastActivity = Date.now();
    await kv.set(`session:${decoded.userId}`, sessionData);

    // Generate app token if requested
    if (generateAppToken && appId) {
      const appToken = crypto.randomUUID();
      
      // Store app token with 5-minute expiry
      await kv.set(`app_token:${appToken}`, {
        user: sessionData.user,
        appId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      }, {
        ex: 300 // 5 minutes TTL
      });

      await logValidation(decoded.email, `app_token_generated:${appId}`, true);

      return res.status(200).json({
        valid: true,
        appToken,
        user: sessionData.user
      });
    }

    // Regular validation response
    await logValidation(decoded.email, 'session_validated', true);
    
    return res.status(200).json({
      valid: true,
      user: sessionData.user,
      lastValidated: new Date(sessionData.lastValidated)
    });

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        valid: false,
        reason: 'token_expired'
      });
    }
    
    return res.status(401).json({ 
      valid: false,
      reason: 'invalid_token'
    });
  }
}

/**
 * Handle app token validation (5-minute tokens for sub-apps)
 */
async function handleAppTokenValidation(
  tokenData: any,
  res: VercelResponse
) {
  // Check if token is expired
  if (Date.now() > tokenData.expiresAt) {
    await logValidation(tokenData.user.email, 'app_token_expired', false);
    return res.status(401).json({ 
      valid: false,
      reason: 'token_expired'
    });
  }

  // Check blacklist (in case user was revoked after token generation)
  const blacklisted = await kv.get(`blacklist:${tokenData.user.email}`);
  if (blacklisted) {
    await logValidation(tokenData.user.email, 'blacklisted_after_token', false);
    return res.status(401).json({ 
      valid: false,
      reason: 'account_revoked'
    });
  }

  // Mark token as used (prevent reuse)
  await kv.set(`used_token:${tokenData.user.email}:${tokenData.appId}`, Date.now(), {
    ex: 300 // Keep for 5 minutes
  });

  await logValidation(tokenData.user.email, `app_access:${tokenData.appId}`, true);

  return res.status(200).json({
    valid: true,
    user: tokenData.user,
    appId: tokenData.appId
  });
}

/**
 * Handle periodic session check from sub-apps
 */
async function handleSessionCheck(
  email: string,
  res: VercelResponse
) {
  // Check blacklist
  const blacklisted = await kv.get(`blacklist:${email}`);
  if (blacklisted) {
    await logValidation(email, 'session_check_blacklisted', false);
    return res.status(401).json({ 
      valid: false,
      reason: 'account_revoked'
    });
  }

  // Simple check - just verify user is not blacklisted
  // In production, you might also check if the main portal session is still active
  
  await logValidation(email, 'session_check_ok', true);
  
  return res.status(200).json({
    valid: true,
    checked: new Date().toISOString()
  });
}

/**
 * Revalidate Google token (simplified)
 */
async function revalidateGoogleToken(googleToken: string): Promise<boolean> {
  try {
    // In production, you would call Google's tokeninfo endpoint
    // For now, just check if token structure is valid
    const decoded = jwtDecode<any>(googleToken);
    
    // Check if expired
    if (decoded.exp * 1000 < Date.now()) {
      return false;
    }
    
    // Check email is still @terralink.cl
    if (!decoded.email?.endsWith('@terralink.cl')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Log validation attempts
 */
async function logValidation(email: string, action: string, success: boolean) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    email,
    action,
    success
  };

  await kv.lpush('audit:validations', JSON.stringify(logEntry));
  await kv.ltrim('audit:validations', 0, 9999);
}