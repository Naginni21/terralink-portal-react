export type UserRole = 'admin' | 'operaciones' | 'ventas' | 'usuario';

export type ViewMode = 'grid' | 'list';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  id: string;
  verified_email: boolean;
}

export interface AuthState {
  user: User | null;
  googleUser: GoogleUser | null;
  isLoading: boolean;
  isValidating: boolean;
  lastValidated: number | null;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  iconName: string;
  url: string | null;
  color: string;
  roles: UserRole[];
  category: string;
}

export interface AccessLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  app: string | null;
}