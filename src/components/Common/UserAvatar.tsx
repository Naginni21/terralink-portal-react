import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  const getBackgroundColor = (name: string) => {
    // Generate consistent color based on name
    const colors = [
      'bg-indigo-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-teal-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  if (!src || imgError) {
    // Fallback to initials or icon
    if (name && name.trim()) {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${getBackgroundColor(name)} ${className}`}
        >
          {getInitials(name)}
        </div>
      );
    }
    
    // Ultimate fallback to user icon
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-400 flex items-center justify-center text-white ${className}`}
      >
        <UserIcon className="w-1/2 h-1/2" />
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  );
}