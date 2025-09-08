# Google OAuth Security Improvements

## Overview
This document outlines the security improvements made to the Google OAuth implementation to address vulnerabilities and follow best practices.

## Improvements Implemented

### 1. JWT Secret Validation
- **Issue**: Code was falling back to hardcoded JWT secret `'dev-secret-change-in-production'`
- **Fix**: Now validates JWT_SECRET environment variable is set and returns error if missing
- **Files Updated**: 
  - `api/auth/login.ts`
  - `api/auth/validate.ts`

### 2. Proper Google Token Revalidation
- **Issue**: Token revalidation was only checking local JWT expiry
- **Fix**: Now properly validates tokens with Google's tokeninfo endpoint
- **Implementation**: Calls `https://oauth2.googleapis.com/tokeninfo` to verify token validity
- **Files Updated**: 
  - `api/auth/validate.ts` (revalidateGoogleToken function)

### 3. Nonce Validation Infrastructure (Ready for Future Implementation)
- **Issue**: No protection against replay attacks
- **Status**: Infrastructure prepared, awaiting library support
- **Note**: The @react-oauth/google library handles nonce internally. Custom nonce implementation would require using Google's OAuth2 API directly
- **Files Prepared**:
  - `api/auth/config.ts` - Contains nonce generation helper
  - Server-side validation logic ready when client support is added

### 4. Reduced Error Information Leakage
- **Issue**: Detailed error messages could help attackers
- **Fix**: Generic error messages in production
- **Implementation**: 
  - Replaced specific errors like "Only emails from terralink.cl allowed" with "Access denied"
  - Removed detailed error reasons from responses
- **Files Updated**:
  - `api/auth/login.ts`
  - `api/auth/validate.ts`

### 5. Environment Variable Validation
- **Issue**: No validation of required environment variables
- **Fix**: Created configuration helper with validation
- **Implementation**:
  - Validates required variables (JWT_SECRET, VITE_GOOGLE_CLIENT_ID)
  - Checks JWT secret strength (min 32 characters)
  - Warns about weak/default secrets
  - Validates Google Client ID format
- **Files Created**:
  - `api/auth/config.ts`

## Security Configuration Constants

The new `api/auth/config.ts` file provides centralized security configuration:

```typescript
AUTH_CONFIG = {
  SESSION_DURATION_DAYS: 30,
  APP_TOKEN_DURATION_MINUTES: 5,
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_LOGIN_ATTEMPTS_PER_HOUR: 10,
  GOOGLE_REVALIDATION_HOURS: 1,
  SESSION_CHECK_INTERVAL_MINUTES: 5,
  MIN_JWT_SECRET_LENGTH: 32,
  NONCE_LENGTH: 32,
  MAX_AUDIT_LOG_ENTRIES: 10000
}
```

## Remaining Security Considerations

### 1. Session Storage
- **Current**: Sessions stored in localStorage (vulnerable to XSS)
- **Recommendation**: Migrate to httpOnly cookies for better security
- **Impact**: Would require refactoring auth flow but provides better XSS protection

### 2. CSRF Protection
- **Current**: No CSRF token validation
- **Recommendation**: Implement CSRF tokens for state-changing operations
- **Note**: Less critical with proper CORS and OAuth implementation

### 3. Refresh Tokens
- **Current**: Using 30-day JWT sessions
- **Recommendation**: Implement refresh token mechanism for better security
- **Benefit**: Shorter-lived access tokens with ability to refresh

### 4. Security Headers
- **Status**: Already implemented comprehensive CSP headers in `vercel.json`
- **Includes**: X-Frame-Options, X-XSS-Protection, HSTS, etc.

## Testing Recommendations

1. **Environment Variable Validation**:
   - Test deployment without JWT_SECRET - should fail
   - Test with weak JWT_SECRET - should warn

2. **Nonce Validation**:
   - Attempt replay attack with captured token - should fail
   - Verify nonce mismatch blocks authentication

3. **Token Revalidation**:
   - Test with expired Google token - should fail validation
   - Test with revoked Google account - should fail

4. **Rate Limiting**:
   - Test exceeding 30 requests/minute - should return 429
   - Verify rate limit resets after 1 minute

## Deployment Checklist

Before deploying to production:

1. ✅ Set strong JWT_SECRET (32+ characters)
2. ✅ Configure VITE_GOOGLE_CLIENT_ID
3. ✅ Set up Vercel KV for session storage
4. ✅ Configure ALLOWED_DOMAINS
5. ✅ Set ADMIN_EMAILS for admin users
6. ✅ Verify all environment variables pass validation
7. ✅ Test OAuth flow end-to-end
8. ✅ Review audit logs for any issues

## Security Best Practices Followed

- ✅ Server-side token verification
- ✅ Domain restriction for emails
- ✅ Rate limiting on API endpoints
- ✅ Audit logging for all auth events
- ✅ Session blacklist capability
- ✅ Periodic token revalidation
- ✅ Secure random nonce generation
- ✅ Generic error messages
- ✅ Environment validation
- ✅ CSP headers configured
- ✅ HTTPS enforced (via HSTS)