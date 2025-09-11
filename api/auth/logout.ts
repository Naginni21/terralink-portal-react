import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { setCorsHeaders } from '../lib/cors';

/**
 * Logout Endpoint
 * Destroys the session and clears the cookie
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set secure CORS headers
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session cookie
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/terralink_session=([^;]+)/);
    
    if (sessionMatch) {
      const sessionId = sessionMatch[1];

      // Get session data to validate CSRF and log the logout
      try {
        const sessionData = await kv.get(`session:${sessionId}`) as {
          user: { email: string; name?: string };
          csrfToken?: string;
          createdAt: string;
        } | null;
        
        if (sessionData) {
          // Validate CSRF token if present in session
          if (sessionData.csrfToken) {
            const providedToken = req.headers['x-csrf-token'] as string;
            if (!providedToken || providedToken !== sessionData.csrfToken) {
              return res.status(403).json({ error: 'Invalid CSRF token' });
            }
          }
          
          // Remove session from KV
          await kv.del(`session:${sessionId}`);
          
          // Remove from user's sessions list
          await kv.srem(`user:sessions:${sessionData.user.email}`, sessionId);
          
          // Log logout
          await kv.lpush('audit:logins', JSON.stringify({
            timestamp: new Date().toISOString(),
            action: 'LOGOUT',
            email: sessionData.user.email,
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            userAgent: req.headers['user-agent']
          }));
          await kv.ltrim('audit:logins', 0, 999);
        }
      } catch (kvError) {
        console.error('KV operation error during logout:', kvError);
        // Continue with logout even if KV fails
      }
    }

    // Clear the session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'terralink_session=',
      'HttpOnly',
      'Path=/',
      'Max-Age=0' // Expire immediately
    ];
    
    // Only add Secure flag in production or if using HTTPS
    if (isProduction || req.headers['x-forwarded-proto'] === 'https') {
      cookieOptions.push('Secure');
    }
    
    cookieOptions.push('SameSite=Lax');
    
    // Allow custom domain via environment variable
    const cookieDomain = process.env.COOKIE_DOMAIN;
    if (isProduction && cookieDomain) {
      cookieOptions.push(`Domain=${cookieDomain}`);
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}