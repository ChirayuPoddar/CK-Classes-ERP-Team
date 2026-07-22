import React, { useState } from 'react';
import { Users, Shield, Lock, Activity } from 'lucide-react';
import { UsersList } from './components/UsersList';
import { RoleManagement } from './components/RoleManagement';
import { PermissionMatrix } from './components/PermissionMatrix';
import { ActivityLog } from './components/ActivityLog';

export const UsersRolesSettings = ({ searchQuery }) => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permissions', label: 'Permission Matrix', icon: Lock },
    { id: 'activity', label: 'Login & Activity', icon: Activity }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Users & Roles</h2>
        <p className="text-sm text-slate-500 mt-1">
          Identity and Access Management (IAM) for the entire ERP system.
        </p>
      </div>

      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className={`
                  -ml-0.5 mr-2 h-4 w-4
                  ${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'}
                `} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-h-0 relative">
        {activeTab === 'users' && <UsersList searchQuery={searchQuery} />}
        {activeTab === 'roles' && <RoleManagement searchQuery={searchQuery} />}
        {activeTab === 'permissions' && <PermissionMatrix searchQuery={searchQuery} />}
        {activeTab === 'activity' && <ActivityLog searchQuery={searchQuery} />}
      </div>
    </div>
  );
};
