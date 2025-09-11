import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Get allowed origins from environment or use secure defaults
 */
function getAllowedOrigins(): string[] {
  // Parse from environment variable
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];
  
  // Default allowed origins
  const defaultOrigins = [
    'https://terralink-portal.vercel.app',
    'https://terralink-portal-react.vercel.app'
  ];
  
  // In development, also allow localhost
  if (process.env.NODE_ENV !== 'production') {
    defaultOrigins.push(
      'http://localhost:6001',
      'http://localhost:5173',
      'http://localhost:3000'
    );
  }
  
  return [...new Set([...defaultOrigins, ...envOrigins])];
}

/**
 * Validate origin against whitelist
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // In preview environments, allow Vercel preview URLs
  if (process.env.VERCEL_ENV === 'preview' && origin.includes('.vercel.app')) {
    return true;
  }
  
  return false;
}

// CORS configuration for API endpoints
export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  
  // Only set origin header if it's allowed
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production') {
    // In development only, be more permissive
    res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:6001');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  // In production, if origin is not allowed, don't set CORS headers
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  // Cache preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
}

// Helper to handle OPTIONS requests
export function handleOptionsRequest(res: VercelResponse) {
  res.status(200).end();
  return true;
}

// Wrapper for API handlers with CORS
export function withCors(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCorsHeaders(req, res);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return handler(req, res);
  };
}