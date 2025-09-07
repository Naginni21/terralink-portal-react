import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const app = express();
const PORT = 4500;

// In-memory storage for development
const sessions = new Map();
const appTokens = new Map();
const blacklist = new Set();

// Google OAuth client - using the same client ID as frontend
const GOOGLE_CLIENT_ID = '655900320406-91n0vl0dd1o62p125rlu0msqf47gb03g.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
app.use(cors({
  origin: ['http://localhost:6001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Helper to determine user role
function getUserRole(email) {
  const roleMappings = {
    'felipe.silva@terralink.cl': 'admin',
    'admin@terralink.cl': 'admin',
  };
  
  if (roleMappings[email]) {
    return roleMappings[email];
  }
  
  if (email.includes('ventas')) return 'ventas';
  if (email.includes('operaciones')) return 'operaciones';
  return 'usuario';
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    
    const googleUser = ticket.getPayload();
    
    if (!googleUser || !googleUser.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check domain
    if (!googleUser.email.endsWith('@terralink.cl')) {
      return res.status(403).json({ error: 'Only @terralink.cl emails allowed' });
    }
    
    // Check blacklist
    if (blacklist.has(googleUser.email)) {
      return res.status(403).json({ error: 'Access revoked' });
    }
    
    // Create session
    const userRole = getUserRole(googleUser.email);
    const sessionToken = jwt.sign(
      {
        userId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        role: userRole
      },
      'dev-secret-key-for-local-testing',
      { expiresIn: '30d' }
    );
    
    // Store session
    sessions.set(sessionToken, {
      userId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      role: userRole,
      createdAt: Date.now()
    });
    
    res.json({
      sessionToken,
      user: {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        avatar: googleUser.picture,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Validate endpoint
app.post('/api/auth/validate', async (req, res) => {
  try {
    const { sessionToken, appToken, generateAppToken, appId } = req.body;
    
    // Validate app token if provided
    if (appToken) {
      const tokenData = appTokens.get(appToken);
      if (!tokenData || Date.now() > tokenData.expiresAt) {
        return res.json({ valid: false });
      }
      
      if (blacklist.has(tokenData.email)) {
        appTokens.delete(appToken);
        return res.json({ valid: false });
      }
      
      return res.json({
        valid: true,
        user: {
          id: tokenData.userId,
          email: tokenData.email,
          name: tokenData.name,
          role: tokenData.role
        }
      });
    }
    
    // Validate session token
    if (!sessionToken) {
      return res.json({ valid: false });
    }
    
    try {
      const decoded = jwt.verify(sessionToken, 'dev-secret-key-for-local-testing');
      
      if (blacklist.has(decoded.email)) {
        sessions.delete(sessionToken);
        return res.json({ valid: false });
      }
      
      // Check if session exists in memory, or use decoded data for testing
      let sessionData = sessions.get(sessionToken);
      if (!sessionData) {
        // For testing: accept valid JWT even if not in sessions Map
        sessionData = {
          userId: decoded.userId || decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          createdAt: Date.now()
        };
        // Store it for future requests
        sessions.set(sessionToken, sessionData);
      }
      
      // Generate app token if requested
      let newAppToken = null;
      if (generateAppToken && appId) {
        newAppToken = crypto.randomUUID();
        appTokens.set(newAppToken, {
          ...sessionData,
          appId,
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
      }
      
      res.json({
        valid: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name,
          role: sessionData.role
        },
        appToken: newAppToken
      });
    } catch (error) {
      return res.json({ valid: false });
    }
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Revoke endpoint (admin only)
app.post('/api/auth/revoke', async (req, res) => {
  try {
    const { adminToken, userEmail } = req.body;
    
    if (!adminToken || !userEmail) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    // Verify admin token
    try {
      const decoded = jwt.verify(adminToken, 'dev-secret-key-for-local-testing');
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Add to blacklist
      blacklist.add(userEmail);
      
      // Remove active sessions
      for (const [token, session] of sessions.entries()) {
        if (session.email === userEmail) {
          sessions.delete(token);
        }
      }
      
      // Remove app tokens
      for (const [token, tokenData] of appTokens.entries()) {
        if (tokenData.email === userEmail) {
          appTokens.delete(token);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid admin token' });
    }
  } catch (error) {
    console.error('Revoke error:', error);
    res.status(500).json({ error: 'Revocation failed' });
  }
});

// App token generation endpoint
app.post('/api/auth/app-token', async (req, res) => {
  try {
    const { sessionToken, appId } = req.body;
    
    if (!sessionToken || !appId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    // Verify session token
    try {
      const decoded = jwt.verify(sessionToken, 'dev-secret-key-for-local-testing');
      
      if (blacklist.has(decoded.email)) {
        return res.status(403).json({ error: 'Access revoked' });
      }
      
      // Check if session exists in memory, or use decoded data for testing
      let sessionData = sessions.get(sessionToken);
      if (!sessionData) {
        // For testing: accept valid JWT even if not in sessions Map
        sessionData = {
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          createdAt: Date.now()
        };
        // Store it for future requests
        sessions.set(sessionToken, sessionData);
      }
      
      // Check role-based access to app
      const appPermissions = {
        'geotruck': ['admin', 'operaciones'],
        'geocal': ['admin', 'operaciones'],
        'terralink360': ['admin', 'ventas'],
        'ctpanel': ['admin', 'operaciones', 'ventas'],
        'cuentas': ['admin'],
        'reportes': ['admin', 'operaciones', 'ventas'],
        'config': ['admin']
      };
      
      const allowedRoles = appPermissions[appId];
      if (!allowedRoles || !allowedRoles.includes(sessionData.role)) {
        return res.status(403).json({ error: 'Access denied to this application' });
      }
      
      // Generate app token
      const appToken = crypto.randomUUID();
      appTokens.set(appToken, {
        ...sessionData,
        appId,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      
      res.json({ appToken });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session token' });
    }
  } catch (error) {
    console.error('App token generation error:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// Validate app token endpoint
app.post('/api/auth/validate-app-token', async (req, res) => {
  try {
    const { appToken } = req.body;
    
    if (!appToken) {
      return res.json({ valid: false });
    }
    
    const tokenData = appTokens.get(appToken);
    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.json({ valid: false });
    }
    
    if (blacklist.has(tokenData.email)) {
      appTokens.delete(appToken);
      return res.json({ valid: false });
    }
    
    res.json({
      valid: true,
      user: {
        id: tokenData.userId,
        email: tokenData.email,
        name: tokenData.name,
        role: tokenData.role
      },
      appId: tokenData.appId,
      expiresAt: tokenData.expiresAt
    });
  } catch (error) {
    console.error('App token validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Check session endpoint (for periodic validation)
app.post('/api/auth/check-session', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    
    if (blacklist.has(email)) {
      return res.json({ valid: false });
    }
    
    res.json({ valid: true });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

// Legacy endpoint for backward compatibility
app.get('/api/auth/check/:email', (req, res) => {
  const { email } = req.params;
  
  if (blacklist.has(email)) {
    return res.json({ valid: false });
  }
  
  res.json({ valid: true });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/validate');
  console.log('  POST /api/auth/app-token');
  console.log('  POST /api/auth/validate-app-token');
  console.log('  POST /api/auth/check-session');
  console.log('  POST /api/auth/revoke');
  console.log('  GET  /api/auth/check/:email');
});