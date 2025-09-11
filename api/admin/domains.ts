import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// In-memory storage for demo (use database in production)
const allowedDomains = new Set([
  'terralink.com.br',
  'example.com' // For testing
]);

interface DomainSettings {
  addedAt: string;
  addedBy: string;
  userCount?: number;
}

const domainSettings: Map<string, DomainSettings> = new Map();

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

  // Admin only endpoint
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    // Get all allowed domains
    const domains = Array.from(allowedDomains).map(domain => {
      const settings = domainSettings.get(domain) || {};
      return {
        domain,
        addedAt: settings.addedAt || '2024-01-01T00:00:00Z',
        addedBy: settings.addedBy || 'system',
        status: 'active',
        userCount: settings.userCount || 0
      };
    });

    return res.status(200).json({
      domains,
      total: domains.length
    });
  }

  if (req.method === 'POST') {
    // Add new domain
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain required' });
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9]+([-.]a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    if (allowedDomains.has(domain)) {
      return res.status(400).json({ error: 'Domain already exists' });
    }

    allowedDomains.add(domain);
    domainSettings.set(domain, {
      addedAt: new Date().toISOString(),
      addedBy: decoded.email
    });

    return res.status(200).json({
      success: true,
      domain: {
        domain,
        addedAt: domainSettings.get(domain).addedAt,
        addedBy: domainSettings.get(domain).addedBy
      }
    });
  }

  if (req.method === 'DELETE') {
    // Remove domain
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain required' });
    }

    if (!allowedDomains.has(domain)) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Don't allow removing the admin's domain
    if (domain === decoded.domain) {
      return res.status(400).json({ error: 'Cannot remove your own domain' });
    }

    allowedDomains.delete(domain);
    domainSettings.delete(domain);

    return res.status(200).json({
      success: true,
      removedDomain: domain
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}