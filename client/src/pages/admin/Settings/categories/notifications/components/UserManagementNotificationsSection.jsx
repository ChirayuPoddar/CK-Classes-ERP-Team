import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const userManagementSchema = z.object({
  userCreated: z.boolean(),
  roleAssigned: z.boolean(),
  roleChanged: z.boolean(),
  passwordReset: z.boolean(),
  accountLocked: z.boolean(),
  accountUnlocked: z.boolean(),
  newLogin: z.boolean(),
  failedLogin: z.boolean()
});

export const UserManagementNotificationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(userManagementSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('userManagement', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.userManagement);
    }
  });

  const isMatch = searchQuery && (
    'User Management Notifications'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'user'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'security'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="User Management Notifications"
        description="Configure triggers for account creation, role changes, and security alerts."
        icon={Users}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Account Events</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('userCreated')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">New User Created</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('roleAssigned')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Role Assigned</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('roleChanged')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Role Changed</span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Security Events</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('passwordReset')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Password Reset</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('accountLocked')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Account Locked</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('accountUnlocked')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Account Unlocked</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('newLogin')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">New Login Detected (New Device)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('failedLogin')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Failed Login Attempts Alert</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
