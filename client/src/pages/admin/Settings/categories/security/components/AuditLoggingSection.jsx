import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileSearch } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const auditSchema = z.object({
  enableAuditLogs: z.boolean(),
  retentionPeriod: z.coerce.number().min(30).max(3650),
  logUserActions: z.boolean(),
  logAdminActions: z.boolean(),
  logSecurityEvents: z.boolean(),
  logPermissionChanges: z.boolean(),
  logConfigurationChanges: z.boolean()
});

export const AuditLoggingSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(auditSchema),
    defaultValues: initialData || {}
  });

  const isEnabled = watch('enableAuditLogs');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('auditLogging', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.auditLogging);
    }
  });

  const isMatch = searchQuery && (
    'Audit Logging'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'audit'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'log'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Audit Logging & Compliance"
        description="Configure what events are tracked and how long they are retained for compliance."
        icon={FileSearch}
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
                <input type="checkbox" {...register('enableAuditLogs')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enable Security Audit Logs</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Disabling this may violate compliance standards (e.g., GDPR, FERPA).</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Retention Policies</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Log Retention Period (Days)</label>
                <input type="number" {...register('retentionPeriod')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Number of days to keep logs before automatic purging. Max 10 years (3650 days).</p>
              </div>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Tracked Event Types</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('logSecurityEvents')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Authentication & Security Events (Logins, MFA)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('logAdminActions')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Administrative Actions (High Privileges)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('logPermissionChanges')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Role & Permission Changes</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('logConfigurationChanges')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">System Configuration Changes (Settings)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('logUserActions')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Standard User Actions (Data Entry, Edits)</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
