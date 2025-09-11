import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// In-memory storage for demo (use database in production)
interface Activity {
  id: string;
  userEmail: string;
  appId: string;
  appName: string;
  action: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  userRole: string;
  userDomain: string;
}

const activities: Map<string, Activity[]> = new Map();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface DecodedToken {
  email: string;
  role: string;
  domain: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  let decoded: DecodedToken;

  try {
    decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'POST') {
    // Track activity
    const { appId, appName, action, metadata } = req.body;

    if (!appId || !appName || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail: decoded.email,
      appId,
      appName,
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      userRole: decoded.role,
      userDomain: decoded.domain
    };

    // Store activity
    const userActivities = activities.get(decoded.email) || [];
    userActivities.push(activity);
    activities.set(decoded.email, userActivities);

    // Also store in global activities for admin view
    const allActivities = activities.get('__all__') || [];
    allActivities.push(activity);
    activities.set('__all__', allActivities);

    // Keep only last 1000 activities per user and 5000 total
    if (userActivities.length > 1000) {
      activities.set(decoded.email, userActivities.slice(-1000));
    }
    if (allActivities.length > 5000) {
      activities.set('__all__', allActivities.slice(-5000));
    }

    return res.status(200).json({ 
      success: true, 
      activity: {
        id: activity.id,
        timestamp: activity.timestamp
      }
    });
  }

  if (req.method === 'GET') {
    // Get activities (admin only for all users, users can see their own)
    const { email, limit = 100 } = req.query;
    
    if (email && email !== decoded.email && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view other users activities' });
    }

    const targetEmail = email as string || (decoded.role === 'admin' ? '__all__' : decoded.email);
    const userActivities = activities.get(targetEmail) || [];
    
    // Return most recent activities
    const limitNum = Math.min(parseInt(limit as string) || 100, 1000);
    const recentActivities = userActivities.slice(-limitNum).reverse();

    return res.status(200).json({
      activities: recentActivities,
      total: userActivities.length,
      user: targetEmail === '__all__' ? 'all' : targetEmail
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}