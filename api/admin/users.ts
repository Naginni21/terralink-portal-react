import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// In-memory storage for demo (use database in production)
const users: Map<string, any> = new Map();
const sessions: Map<string, any> = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

interface DecodedToken {
  email: string;
  role: string;
  domain: string;
}

// Helper to get all user data
function getAllUsersData() {
  const allUsers: any[] = [];
  
  // Collect users from sessions
  sessions.forEach((session, sessionId) => {
    const existingUser = allUsers.find(u => u.email === session.email);
    if (!existingUser) {
      allUsers.push({
        email: session.email,
        role: session.role || 'default',
        domain: session.domain,
        lastLogin: session.lastLogin || session.createdAt,
        sessions: [sessionId],
        isActive: true
      });
    } else {
      existingUser.sessions.push(sessionId);
      if (session.lastLogin > existingUser.lastLogin) {
        existingUser.lastLogin = session.lastLogin;
      }
    }
  });

  // Add stored user data
  users.forEach((userData, email) => {
    const existingUser = allUsers.find(u => u.email === email);
    if (existingUser) {
      Object.assign(existingUser, userData);
    } else {
      allUsers.push({
        ...userData,
        email,
        sessions: [],
        isActive: false
      });
    }
  });

  return allUsers;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Admin only endpoint
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    // Get all users
    const allUsers = getAllUsersData();
    
    // Sort by last login (most recent first)
    allUsers.sort((a, b) => {
      const dateA = new Date(a.lastLogin || 0).getTime();
      const dateB = new Date(b.lastLogin || 0).getTime();
      return dateB - dateA;
    });

    return res.status(200).json({
      users: allUsers,
      total: allUsers.length,
      activeSessions: sessions.size
    });
  }

  if (req.method === 'PUT') {
    // Update user role
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role required' });
    }

    if (!['admin', 'customer', 'default'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user data
    const userData = users.get(email) || {};
    userData.role = role;
    userData.updatedAt = new Date().toISOString();
    userData.updatedBy = decoded.email;
    users.set(email, userData);

    // Update all active sessions for this user
    sessions.forEach((session, sessionId) => {
      if (session.email === email) {
        session.role = role;
      }
    });

    return res.status(200).json({
      success: true,
      user: {
        email,
        role,
        updatedAt: userData.updatedAt,
        updatedBy: userData.updatedBy
      }
    });
  }

  if (req.method === 'DELETE') {
    // Revoke user access (delete all sessions)
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Don't allow admin to revoke their own access
    if (email === decoded.email) {
      return res.status(400).json({ error: 'Cannot revoke your own access' });
    }

    // Remove all sessions for this user
    let revokedCount = 0;
    sessions.forEach((session, sessionId) => {
      if (session.email === email) {
        sessions.delete(sessionId);
        revokedCount++;
      }
    });

    // Mark user as revoked
    const userData = users.get(email) || {};
    userData.revokedAt = new Date().toISOString();
    userData.revokedBy = decoded.email;
    users.set(email, userData);

    return res.status(200).json({
      success: true,
      revokedSessions: revokedCount,
      user: {
        email,
        revokedAt: userData.revokedAt,
        revokedBy: userData.revokedBy
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}