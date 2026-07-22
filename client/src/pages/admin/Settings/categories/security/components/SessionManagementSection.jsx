import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const sessionSchema = z.object({
  sessionTimeout: z.coerce.number().min(5).max(1440),
  idleTimeout: z.coerce.number().min(1).max(240),
  maxConcurrentSessions: z.coerce.number().min(1).max(10),
  rememberMeDuration: z.coerce.number().min(0).max(365),
  autoLogout: z.boolean(),
  forceLogoutAfterPasswordChange: z.boolean(),
  sessionRefreshInterval: z.coerce.number().min(1).max(60)
});

export const SessionManagementSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('sessionManagement', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.sessionManagement);
    }
  });

  const isMatch = searchQuery && (
    'Session Management'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'session'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'timeout'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Session Management"
        description="Configure inactivity timeouts, concurrent sessions, and token lifecycles."
        icon={Clock}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Absolute Session Timeout (Minutes)</label>
                <input type="number" {...register('sessionTimeout')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Maximum time a user can stay logged in without re-authenticating.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Idle Timeout (Minutes)</label>
                <input type="number" {...register('idleTimeout')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Log user out if no activity is detected.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Token Refresh Interval (Minutes)</label>
                <input type="number" {...register('sessionRefreshInterval')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Concurrent Sessions</label>
                <input type="number" {...register('maxConcurrentSessions')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Number of active devices allowed per account.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Remember Me Duration (Days)</label>
                <input type="number" {...register('rememberMeDuration')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Lifespan of the "Remember Me" persistent cookie.</p>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoLogout')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Auto Logout on Browser Close</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('forceLogoutAfterPasswordChange')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Force logout all devices after password change</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
