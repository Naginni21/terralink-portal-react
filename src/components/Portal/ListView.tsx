import React from 'react';
import { ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { UserRole, Application } from '../../types/index';

interface ListViewProps {
  applications: Application[];
  userRole: UserRole;
  onAppClick: (app: Application) => void;
}

export function ListView({ applications, userRole, onAppClick }: ListViewProps) {
  // Group applications by category
  const groupedApps = applications.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = [];
    }
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold" style={{ color: '#4c4849' }}>
            Aplicaciones
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {applications.length} disponibles para {userRole}
          </p>
        </div>
        
        <div className="p-4">
          {Object.entries(groupedApps).map(([category, apps]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#37ade3' }}>
                {category}
              </h3>
              <div className="space-y-1">
                {apps.map((app) => {
                  const IconComponent = Icons[app.iconName as keyof typeof Icons] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
                  return (
                    <button
                      key={app.id}
                      onClick={() => onAppClick(app)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      style={{ 
                        borderLeft: `3px solid transparent`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderLeftColor = '#37ade3';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderLeftColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className={`p-1.5 rounded ${app.color} bg-opacity-10`}>
                        <div className={`${app.color.replace('bg-', 'text-')}`}>
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      </div>
                      {app.url && (
                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#4c4849' }}>
            Selecciona una aplicación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app) => {
              const IconComponent = Icons[app.iconName as keyof typeof Icons] as React.ComponentType<any>;
              return (
                <div
                  key={app.id}
                  onClick={() => onAppClick(app)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                  style={{
                    borderTopColor: '#37ade3',
                    borderTopWidth: '3px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(55, 173, 227, 0.1), 0 4px 6px -2px rgba(55, 173, 227, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${app.color} bg-opacity-10`}>
                      <div className={`${app.color.replace('bg-', 'text-')}`}>
                        {IconComponent && <IconComponent className="w-6 h-6" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold" style={{ color: '#4c4849' }}>{app.name}</h3>
                        {app.url && (
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">
                          {app.category}
                        </span>
                        <span className={`text-xs`} style={{ color: app.url ? '#37ade3' : '#9ca3af' }}>
                          {app.url ? '● Activo' : '○ Próximamente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}