import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, Plus, Mail, Ban, CheckCircle, RotateCcw, Trash2, Download } from 'lucide-react';
import { iamService } from '@/services/iamService';
import { UserProfileDrawer } from './UserProfileDrawer';
import { UserCreateModal } from './UserCreateModal';

export const UsersList = ({ searchQuery }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['iam_users'],
    queryFn: iamService.getUsers
  });

  const statusMutation = useMutation({
    mutationFn: ({ userIds, status }) => iamService.updateUserStatus(userIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['iam_users']);
      setSelectedUsers([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userIds) => iamService.deleteUsers(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['iam_users']);
      setSelectedUsers([]);
    }
  });

  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Global or local search
    const search = (localSearch || searchQuery || '').toLowerCase();
    if (search) {
      result = result.filter(u => 
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(search)) ||
        (u.studentId && u.studentId.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(u => u.status === statusFilter);
    }

    return result;
  }, [users, localSearch, searchQuery, statusFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const openUserProfile = (user) => {
    setActiveUser(user);
    setIsDrawerOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inactive': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending Verification': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-lg w-full" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg w-full" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center flex-1 w-full gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending Verification">Pending</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4 mr-2 text-slate-500" />
            Export
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-indigo-800">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => statusMutation.mutate({ userIds: selectedUsers, status: 'Active' })}
              disabled={statusMutation.isPending}
              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors" title="Activate"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button 
              onClick={() => statusMutation.mutate({ userIds: selectedUsers, status: 'Suspended' })}
              disabled={statusMutation.isPending}
              className="p-2 text-orange-600 hover:bg-orange-100 rounded-md transition-colors" title="Suspend"
            >
              <Ban className="h-4 w-4" />
            </button>
            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Reset Password">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="p-2 text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Email Users">
              <Mail className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-indigo-200 mx-1"></div>
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to delete selected users?')) {
                  deleteMutation.mutate(selectedUsers);
                }
              }}
              disabled={deleteMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                        openUserProfile(user);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium">{user.role}</div>
                      <div className="text-xs text-slate-500">{user.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {user.employeeId || user.studentId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDrawerOpen && (
        <UserProfileDrawer 
          user={activeUser} 
          onClose={() => setIsDrawerOpen(false)} 
        />
      )}

      {isCreateModalOpen && (
        <UserCreateModal 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}
    </div>
  );
};
