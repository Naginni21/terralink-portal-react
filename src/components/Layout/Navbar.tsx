import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../Common/UserAvatar';
import type { User, UserRole, ViewMode } from '../../types/index';

interface NavbarProps {
  user: User;
  userRole: UserRole;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onLogout: () => void;
}

export function Navbar({ user, userRole, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  
  const darkPatternStyle = {
    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)',
    position: 'relative' as const,
    overflow: 'hidden' as const
  };

  const patternOverlay = {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    pointerEvents: 'none' as const
  };

  return (
    <nav className="shadow-lg relative" style={darkPatternStyle}>
      <div style={patternOverlay}></div>
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-white">
                    Portal
                  </h1>
                  <img 
                    src="/logoterralinkwhite.png" 
                    alt="Terralink" 
                    className="h-9 w-auto object-contain"
                    style={{ marginTop: '6px' }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1">Sistema Interno</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <UserAvatar 
                src={user.image}
                name={user.name}
                size="sm"
                className="border-2 border-white/30"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-300 capitalize">{userRole}</p>
              </div>
            </div>
            
            {userRole === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white hidden md:inline">Admin</span>
              </button>
            )}
            
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}