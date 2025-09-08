import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Session Validation Endpoint
 * Validates session cookies and returns user data
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  const origin = req.headers.origin || 'https://terralink-portal.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session cookie
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/terralink_session=([^;]+)/);
    
    if (!sessionMatch) {
      return res.status(401).json({ 
        error: 'No session found',
        authenticated: false 
      });
    }

    const sessionId = sessionMatch[1];

    // Get session from KV
    let sessionData;
    try {
      sessionData = await kv.get(`session:${sessionId}`);
    } catch (kvError) {
      console.error('KV read error:', kvError);
      // In development, allow bypass
      if (process.env.NODE_ENV !== 'production') {
        return res.status(200).json({
          authenticated: true,
          user: {
            id: 'dev-user',
            email: 'dev@terralink.cl',
            name: 'Development User',
            role: 'admin'
          },
          csrfToken: 'dev-csrf-token'
        });
      }
      throw kvError;
    }

    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Invalid session',
        authenticated: false 
      });
    }

    // Check if session is expired
    const session = sessionData as any;
    if (session.expiresAt < Date.now()) {
      // Clean up expired session
      await kv.del(`session:${sessionId}`);
      await kv.srem(`user:sessions:${session.user.email}`, sessionId);
      
      return res.status(401).json({ 
        error: 'Session expired',
        authenticated: false 
      });
    }

    // Update last activity
    session.lastActivity = Date.now();
    await kv.set(
      `session:${sessionId}`,
      session,
      { ex: Math.floor((session.expiresAt - Date.now()) / 1000) }
    );

    // Return user data
    return res.status(200).json({
      authenticated: true,
      user: session.user,
      csrfToken: session.csrfToken
    });

  } catch (error: any) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      error: 'Session validation failed',
      authenticated: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}