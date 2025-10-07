import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { Application } from '../../types/index';

interface ApplicationCardProps {
  app: Application;
  onAppClick: (app: Application) => void;
}

export function ApplicationCard({ app, onAppClick }: ApplicationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = Icons[app.iconName as keyof typeof Icons] as React.ComponentType<React.SVGProps<SVGSVGElement>>;

  const handleClick = async () => {
    // Track the activity using session cookies
    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: app.id,
          appName: app.name,
          action: 'click',
          metadata: {
            category: app.category,
            hasUrl: !!app.url
          }
        })
      });
    } catch (error) {
      // Activity tracking failed silently
      console.error('Failed to track activity:', error);
    }

    // Call the original click handler
    onAppClick(app);
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${app.color} bg-opacity-10`}>
          <div className={`${app.color.replace('bg-', 'text-')}`}>
            {IconComponent && <IconComponent className="w-6 h-6" />}
          </div>
        </div>
        {app.url && (
          <ExternalLink className={`w-4 h-4 transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-400'}`} />
        )}
      </div>
      
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        {app.name}
      </h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {app.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {app.category}
        </span>
        <span className={`text-xs ${app.url ? 'text-green-600' : 'text-gray-400'}`}>
          {app.url ? '● Activo' : '○ Próximamente'}
        </span>
      </div>
    </div>
  );
}