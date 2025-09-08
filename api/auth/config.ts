/**
 * Authentication configuration and environment validation
 */

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = [
  'JWT_SECRET'
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'KV_URL',
  'KV_REST_API_URL', 
  'KV_REST_API_TOKEN',
  'ALLOWED_DOMAINS',
  'ADMIN_EMAILS'
];

/**
 * Security configuration constants
 */
export const AUTH_CONFIG = {
  // Session durations
  SESSION_DURATION_DAYS: 30,
  APP_TOKEN_DURATION_MINUTES: 5,
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_LOGIN_ATTEMPTS_PER_HOUR: 10,
  
  // Token validation
  GOOGLE_REVALIDATION_HOURS: 1,
  SESSION_CHECK_INTERVAL_MINUTES: 5,
  
  // Security
  MIN_JWT_SECRET_LENGTH: 32,
  NONCE_LENGTH: 32,
  
  // Audit log
  MAX_AUDIT_LOG_ENTRIES: 10000
};

/**
 * Validate environment variables
 * Call this at the start of each API endpoint
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < AUTH_CONFIG.MIN_JWT_SECRET_LENGTH) {
      errors.push(`JWT_SECRET must be at least ${AUTH_CONFIG.MIN_JWT_SECRET_LENGTH} characters`);
    }
    
    // Check for default/weak secrets
    const weakSecrets = [
      'dev-secret',
      'secret',
      'change-me',
      'your-secret-key-here'
    ];
    
    if (weakSecrets.some(weak => process.env.JWT_SECRET?.toLowerCase().includes(weak))) {
      errors.push('JWT_SECRET appears to be a default or weak value');
    }
  }
  
  // Check Google Client ID - try both with and without VITE_ prefix
  const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  
  if (!googleClientId) {
    errors.push('Missing required environment variable: GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID');
  } else if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
    errors.push('Google Client ID does not appear to be valid');
  }
  
  // Warn about recommended variables in production
  if (process.env.NODE_ENV === 'production') {
    for (const varName of RECOMMENDED_ENV_VARS) {
      if (!process.env[varName]) {
        console.warn(`Warning: Recommended environment variable not set: ${varName}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get allowed email domains
 */
export function getAllowedDomains(): string[] {
  const domains = (process.env.ALLOWED_DOMAINS || 'terralink.cl')
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(d => d.length > 0);
  
  if (domains.length === 0) {
    console.warn('No allowed domains configured, defaulting to terralink.cl');
    return ['terralink.cl'];
  }
  
  return domains;
}

/**
 * Get admin email addresses
 */
export function getAdminEmails(): string[] {
  if (!process.env.ADMIN_EMAILS) {
    return [];
  }
  
  return process.env.ADMIN_EMAILS
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'));
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get Google Client ID from environment
 */
export function getGoogleClientId(): string | undefined {
  return process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(AUTH_CONFIG.NONCE_LENGTH).toString('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  const crypto = require('crypto');
  
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}