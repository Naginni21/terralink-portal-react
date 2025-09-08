import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Logout Endpoint
 * Destroys the session and clears the cookie
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  const origin = req.headers.origin || 'https://terralink-portal.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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

      // Get session data to log the logout
      try {
        const sessionData = await kv.get(`session:${sessionId}`) as any;
        
        if (sessionData) {
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
      'Secure',
      'SameSite=Lax',
      'Max-Age=0', // Expire immediately
      'Path=/'
    ];

    if (isProduction) {
      cookieOptions.push('Domain=.vercel.app');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}