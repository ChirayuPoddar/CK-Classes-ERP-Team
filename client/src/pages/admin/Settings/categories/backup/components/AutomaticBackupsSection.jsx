import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { backupSettingsService } from '@/services/backupSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const autoBackupSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly']),
  backupTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format"),
  retentionPolicy: z.coerce.number().min(1).max(3650),
  compression: z.enum(['None', 'Standard', 'High']),
  encryption: z.enum(['None', 'AES-128', 'AES-256']),
  verifyAfterCompletion: z.boolean(),
  retryFailedBackup: z.boolean()
});

export const AutomaticBackupsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(autoBackupSchema),
    defaultValues: initialData || {}
  });

  const isEnabled = watch('enabled');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => backupSettingsService.updateSection('automaticBackups', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['backupSettings'], data);
      setIsEditing(false);
      reset(data.automaticBackups);
    }
  });

  const isMatch = searchQuery && (
    'Automatic Backups'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'schedule'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'auto'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Automatic Backups & Schedules"
        description="Configure automated system snapshots, retention rules, and compression levels."
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
            
            <div className="md:col-span-2 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <input type="checkbox" {...register('enabled')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enable Automated System Backups</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Highly recommended. Prevents catastrophic data loss.</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Schedule & Lifecycle</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Backup Frequency</label>
                <select {...register('frequency')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly (Sundays)</option>
                  <option value="Monthly">Monthly (1st of Month)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Execution Time</label>
                  <input type="time" {...register('backupTime')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                  {errors.backupTime && <p className="text-xs text-red-500 mt-1">{errors.backupTime.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Retention (Days)</label>
                  <input type="number" {...register('retentionPolicy')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                  {errors.retentionPolicy && <p className="text-xs text-red-500 mt-1">{errors.retentionPolicy.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Processing Rules</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Compression Level</label>
                <select {...register('compression')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="None">None (Fastest)</option>
                  <option value="Standard">Standard (Balanced)</option>
                  <option value="High">High (Saves Storage, Slower)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Encryption Algorithm</label>
                <select {...register('encryption')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="None">None (Not Recommended)</option>
                  <option value="AES-128">AES-128</option>
                  <option value="AES-256">AES-256 (Highest Security)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-wrap gap-6 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('verifyAfterCompletion')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Auto-verify integrity after completion</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('retryFailedBackup')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Retry once upon failure (after 30 mins)</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
