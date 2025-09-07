/**
 * Auth API Client
 * Simple client library for interacting with the authentication API
 */

import type { User } from '../types/index';

// Use relative path for API - works with any deployment
const API_BASE = '/api/auth';

export interface LoginResponse {
  sessionToken: string;
  user: User;
  expiresIn: number;
}

export interface ValidationResponse {
  valid: boolean;
  user?: User;
  appToken?: string;
  reason?: string;
}

/**
 * Auth API client methods
 */
export const authApi = {
  /**
   * Login with Google OAuth token
   */
  async login(googleToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  /**
   * Validate a session token
   */
  async validateSession(sessionToken: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },

  /**
   * Get an app token for accessing a sub-app
   */
  async getAppToken(sessionToken: string, appId: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionToken,
        generateAppToken: true,
        appId 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate app token');
    }

    return response.json();
  },

  /**
   * Validate an app token (used by sub-apps)
   */
  async validateAppToken(token: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appToken: token })
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },

  /**
   * Periodic session check (used by sub-apps)
   */
  async checkSession(email: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_BASE}/check/${email}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },

  /**
   * Revoke access for a user (admin only)
   */
  async revokeAccess(
    adminToken: string,
    emailToRevoke: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/revoke`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adminToken, userEmail: emailToRevoke, reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Revocation failed');
    }

    return response.json();
  }
};

/**
 * Helper to get stored session token
 */
export function getStoredSessionToken(): string | null {
  return localStorage.getItem('sessionToken');
}

/**
 * Helper to store session token
 */
export function storeSessionToken(token: string): void {
  localStorage.setItem('sessionToken', token);
}

/**
 * Helper to clear session
 */
export function clearSession(): void {
  localStorage.removeItem('sessionToken');
  sessionStorage.clear();
}