import type { UserRole, Application } from '../types/index';

export const USER_DATABASE: Record<string, { role: UserRole; name: string }> = {
  // ONLY @terralink.cl emails can login - these define their roles
  'felipe.silva@terralink.cl': { role: 'admin', name: 'Felipe Silva' },
  'admin@terralink.cl': { role: 'admin', name: 'Administrador' },
  'operaciones@terralink.cl': { role: 'operaciones', name: 'Usuario O&M' },
  'ventas@terralink.cl': { role: 'ventas', name: 'Usuario Ventas' },
  'usuario@terralink.cl': { role: 'usuario', name: 'Usuario Estándar' },
  
  // Any other @terralink.cl email not listed here will get 'usuario' role by default
  // Non-@terralink.cl emails are BLOCKED at login
};

// Helper function to get the correct URL based on environment
function getAppUrl(subdomain: string | null, localPort?: number): string | null {
  if (!subdomain) return null;
  
  // In production, use subdomains
  if (import.meta.env.PROD) {
    return `https://${subdomain}.apps.terralink.cl`;
  }
  
  // In development, use different ports
  return localPort ? `http://localhost:${localPort}` : null;
}

export const APPLICATIONS_DATA: Application[] = [
  {
    id: 'bess',
    name: 'BESS Dimension',
    description: 'Dimensionamiento de sistemas de almacenamiento de energía',
    iconName: 'Activity',
    url: getAppUrl('bess', 6002),
    color: 'bg-blue-500',
    roles: ['admin', 'operaciones', 'usuario'] as UserRole[],
    category: 'Ingeniería'
  },
  {
    id: 'om-reports',
    name: 'Generador de Reportes O&M',
    description: 'Creación automatizada de reportes de operación y mantenimiento',
    iconName: 'FileText',
    url: getAppUrl('reports', 6003),
    color: 'bg-green-500',
    roles: ['admin', 'operaciones'] as UserRole[],
    category: 'Operaciones'
  },
  {
    id: 'om-dashboard',
    name: 'Dashboard O&M',
    description: 'Métricas y KPIs de operación en tiempo real',
    iconName: 'BarChart3',
    url: getAppUrl('dashboard', 6004),
    color: 'bg-purple-500',
    roles: ['admin', 'operaciones'] as UserRole[],
    category: 'Operaciones'
  },
  {
    id: 'sales',
    name: 'Dashboard de Ventas',
    description: 'Análisis y métricas del equipo comercial',
    iconName: 'TrendingUp',
    url: getAppUrl('sales', 6005),
    color: 'bg-orange-500',
    roles: ['admin', 'ventas'] as UserRole[],
    category: 'Comercial'
  },
  {
    id: 'sdd',
    name: 'Tomador de Medidas SDD',
    description: 'Herramienta para Subsistemas de Distribución',
    iconName: 'Ruler',
    url: getAppUrl('sdd', 6006),
    color: 'bg-indigo-500',
    roles: ['admin', 'operaciones', 'usuario'] as UserRole[],
    category: 'Ingeniería'
  }
];