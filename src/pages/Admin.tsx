import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Activity, Globe, LogOut, RefreshCw, Trash2, UserCheck, Clock, Monitor } from 'lucide-react';

interface User {
  email: string;
  role: string;
  domain: string;
  lastLogin: string;
  sessions: string[];
  isActive: boolean;
}

interface ActivityLog {
  id: string;
  userEmail: string;
  appId: string;
  appName: string;
  action: string;
  timestamp: string;
  metadata?: any;
}

interface Domain {
  domain: string;
  addedAt: string;
  addedBy: string;
  status: string;
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'domains'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/portal');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setUsers(data.users);
        }
      } else if (activeTab === 'activity') {
        const response = await fetch('/api/activity/track', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setActivities(data.activities);
        }
      } else if (activeTab === 'domains') {
        const response = await fetch('/api/admin/domains', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setDomains(data.domains);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  const updateUserRole = async (email: string, newRole: string) => {
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role: newRole })
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const revokeUserAccess = async (email: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const addDomain = async () => {
    if (!newDomain) return;
    
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain: newDomain })
      });
      
      if (response.ok) {
        setNewDomain('');
        loadData();
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    }
  };

  const removeDomain = async (domain: string) => {
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;
    
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain })
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error removing domain:', error);
    }
  };

  const loadUserActivities = async (email: string) => {
    setSelectedUser(email);
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`/api/activity/track?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setActivities(data.activities);
        setActiveTab('activity');
      }
    } catch (error) {
      console.error('Error loading user activities:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAction = (action: string) => {
    const actionMap: { [key: string]: { icon: React.ReactNode; label: string; color: string } } = {
      'click': { icon: <Monitor className="w-4 h-4" />, label: 'Clicked', color: 'text-blue-600' },
      'open': { icon: <Monitor className="w-4 h-4" />, label: 'Opened', color: 'text-green-600' },
      'launch': { icon: <Monitor className="w-4 h-4" />, label: 'Launched', color: 'text-purple-600' }
    };
    
    const actionInfo = actionMap[action] || { icon: <Activity className="w-4 h-4" />, label: action, color: 'text-gray-600' };
    
    return (
      <span className={`flex items-center gap-1 ${actionInfo.color}`}>
        {actionInfo.icon}
        {actionInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => navigate('/portal')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back to Portal
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'users' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'activity' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity className="w-5 h-5" />
                Activity Logs
              </button>
              <button
                onClick={() => setActiveTab('domains')}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'domains' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe className="w-5 h-5" />
                Allowed Domains
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'activity' && `Activity Logs ${selectedUser ? `for ${selectedUser}` : '(All Users)'}`}
                {activeTab === 'domains' && 'Domain Whitelist'}
              </h2>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Domain</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.email} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.email, e.target.value)}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                <option value="default">Default</option>
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">{user.domain}</td>
                            <td className="py-3 px-4">
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                {formatDate(user.lastLogin)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {user.isActive ? <UserCheck className="w-3 h-3" /> : null}
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => loadUserActivities(user.email)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View Activity
                                </button>
                                {user.email !== localStorage.getItem('user_email') && (
                                  <button
                                    onClick={() => revokeUserAccess(user.email)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {selectedUser && (
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          loadData();
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ← Show all users
                      </button>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Application</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activities.map((activity) => (
                            <tr key={activity.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(activity.timestamp)}
                              </td>
                              <td className="py-3 px-4">{activity.userEmail}</td>
                              <td className="py-3 px-4">{activity.appName}</td>
                              <td className="py-3 px-4">{formatAction(activity.action)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'domains' && (
                  <div className="space-y-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        onClick={addDomain}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Add Domain
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Domain</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Added By</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Added On</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {domains.map((domain) => (
                            <tr key={domain.domain} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{domain.domain}</td>
                              <td className="py-3 px-4">{domain.addedBy}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(domain.addedAt)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => removeDomain(domain.domain)}
                                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;