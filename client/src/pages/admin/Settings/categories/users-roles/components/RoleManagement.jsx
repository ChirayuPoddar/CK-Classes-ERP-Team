import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, MoreVertical, Plus, Copy, Edit2, Trash2 } from 'lucide-react';
import { iamService } from '@/services/iamService';

export const RoleManagement = ({ searchQuery }) => {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['iam_roles'],
    queryFn: iamService.getRoles
  });

  const [localSearch, setLocalSearch] = useState('');

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes((localSearch || searchQuery || '').toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl w-full border border-slate-200" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map(role => (
          <div key={role.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{role.description}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Users Assigned</span>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {role.usersCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Created By</span>
                <span className="text-sm text-slate-700">{role.createdBy}</span>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                View Permissions
              </button>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Duplicate">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
                {role.createdBy !== 'System' && (
                  <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
