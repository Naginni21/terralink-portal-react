// Storage abstraction layer
// Currently uses in-memory storage for development
// Can be easily swapped with database implementation

export interface User {
  email: string;
  role: string;
  domain: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
}

export interface Session {
  sessionId: string;
  email: string;
  role: string;
  domain: string;
  createdAt: string;
  lastLogin: string;
  expiresAt: string;
}

export interface Activity {
  id: string;
  userEmail: string;
  appId: string;
  appName: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  userRole: string;
  userDomain: string;
}

export interface Domain {
  domain: string;
  addedAt: string;
  addedBy: string;
  status: string;
}

// In-memory storage (replace with database in production)
class InMemoryStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private activities: Map<string, Activity[]> = new Map();
  private domains: Set<string> = new Set(['terralink.com.br', 'example.com']);
  private domainSettings: Map<string, { addedAt: string; addedBy: string; userCount?: number }> = new Map();

  // Initialize with environment variables
  constructor() {
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
    allowedDomains.forEach(domain => this.domains.add(domain));
    
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    adminEmails.forEach(email => {
      const domain = email.split('@')[1];
      this.users.set(email, {
        email,
        role: 'admin',
        domain,
        createdAt: new Date().toISOString()
      });
    });
  }

  // User methods
  getUser(email: string): User | undefined {
    return this.users.get(email);
  }

  setUser(email: string, user: User): void {
    this.users.set(email, user);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Session methods
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  setSession(sessionId: string, session: Session): void {
    this.sessions.set(sessionId, session);
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getSessionsByEmail(email: string): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.email === email);
  }

  getAllSessions(): Map<string, Session> {
    return this.sessions;
  }

  // Activity methods
  addActivity(activity: Activity): void {
    const userActivities = this.activities.get(activity.userEmail) || [];
    userActivities.push(activity);
    this.activities.set(activity.userEmail, userActivities);
    
    const allActivities = this.activities.get('__all__') || [];
    allActivities.push(activity);
    this.activities.set('__all__', allActivities);
    
    // Keep only last 1000 activities per user and 5000 total
    if (userActivities.length > 1000) {
      this.activities.set(activity.userEmail, userActivities.slice(-1000));
    }
    if (allActivities.length > 5000) {
      this.activities.set('__all__', allActivities.slice(-5000));
    }
  }

  getActivities(email?: string, limit: number = 100): Activity[] {
    const key = email || '__all__';
    const activities = this.activities.get(key) || [];
    return activities.slice(-limit).reverse();
  }

  // Domain methods
  isDomainAllowed(domain: string): boolean {
    return this.domains.has(domain);
  }

  addDomain(domain: string, addedBy: string): void {
    this.domains.add(domain);
    this.domainSettings.set(domain, {
      addedAt: new Date().toISOString(),
      addedBy
    });
  }

  removeDomain(domain: string): void {
    this.domains.delete(domain);
    this.domainSettings.delete(domain);
  }

  getAllDomains(): Domain[] {
    return Array.from(this.domains).map(domain => {
      const settings = this.domainSettings.get(domain) || {};
      return {
        domain,
        addedAt: settings.addedAt || '2024-01-01T00:00:00Z',
        addedBy: settings.addedBy || 'system',
        status: 'active'
      };
    });
  }
}

// Export singleton instance
export const storage = new InMemoryStorage();

// Database implementation placeholder
// Uncomment and implement when ready for production
/*
import { PrismaClient } from '@prisma/client';

class DatabaseStorage {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  // Implement all methods using Prisma
  // ...
}

export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new InMemoryStorage();
*/