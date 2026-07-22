import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const globalSchema = z.object({
  enableNotifications: z.boolean(),
  enableInApp: z.boolean(),
  enableEmail: z.boolean(),
  enableSMS: z.boolean(),
  enablePush: z.boolean(),
  quietHours: z.boolean(),
  maxPerHour: z.coerce.number().min(1).max(1000),
  retryAttempts: z.coerce.number().min(0).max(10)
});

export const GlobalNotificationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(globalSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('global', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.global);
    }
  });

  const isMatch = searchQuery && (
    'Global Notifications'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'global'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Global Notifications"
        description="Master switches and global limits for the entire ERP notification system."
        icon={Globe}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <input type="checkbox" {...register('enableNotifications')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enable All Notifications</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Master kill-switch. If disabled, no notifications will be sent from the ERP.</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900">Global Channel Toggles</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enableInApp')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable In-App Notifications</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enableEmail')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Email Notifications</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enableSMS')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable SMS Notifications</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enablePush')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Mobile Push Notifications</span>
              </label>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900">Global Limits</h4>
              
              <label className="flex items-center space-x-3 cursor-pointer mb-4">
                <input type="checkbox" {...register('quietHours')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enforce Quiet Hours Globally</span>
              </label>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Notifications Per Hour (Per User)</label>
                <input type="number" {...register('maxPerHour')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
                {errors.maxPerHour && <p className="mt-1 text-sm text-red-600">{errors.maxPerHour.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Global Retry Attempts</label>
                <input type="number" {...register('retryAttempts')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
                {errors.retryAttempts && <p className="mt-1 text-sm text-red-600">{errors.retryAttempts.message}</p>}
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
