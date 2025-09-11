/**
 * Simple logger utility that can be toggled based on environment
 */

const isDevelopment = process.env.NODE_ENV !== 'production';
const isDebugEnabled = process.env.DEBUG === 'true';

export const logger = {
  error: (message: string, error?: unknown) => {
    // Always log errors
    if (error instanceof Error) {
      console.error(message, error.message);
    } else {
      console.error(message, error);
    }
  },
  
  warn: (message: string, data?: unknown) => {
    // Log warnings in development or when debug is enabled
    if (isDevelopment || isDebugEnabled) {
      console.warn(message, data);
    }
  },
  
  info: (message: string, data?: unknown) => {
    // Only log info in development
    if (isDevelopment) {
      console.log(message, data);
    }
  },
  
  debug: (message: string, data?: unknown) => {
    // Only log debug when explicitly enabled
    if (isDebugEnabled) {
      console.log('[DEBUG]', message, data);
    }
  }
};