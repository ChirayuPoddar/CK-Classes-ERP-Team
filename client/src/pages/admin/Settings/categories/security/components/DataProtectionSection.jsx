import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Database, DownloadCloud } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const dataSchema = z.object({
  sensitiveDataMasking: z.boolean(),
  exportRestrictions: z.enum(['All', 'Admins Only', 'Blocked']),
  downloadRestrictions: z.enum(['None', 'Watermark', 'Blocked']),
  clipboardProtection: z.boolean(),
  screenshotWarning: z.boolean(),
  dataRetention: z.coerce.number().min(30).max(3650),
  automaticDataCleanup: z.boolean()
});

export const DataProtectionSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(dataSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('dataProtection', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.dataProtection);
    }
  });

  const isMatch = searchQuery && (
    'Data Protection'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'data'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'export'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Data Protection & DLP"
        description="Prevent data exfiltration and enforce data lifecycle rules."
        icon={Database}
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
              <h4 className="text-sm font-semibold text-slate-900">Data Loss Prevention (DLP)</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">CSV/Excel Export Restrictions</label>
                <select {...register('exportRestrictions')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="All">Allow All Users</option>
                  <option value="Admins Only">Restrict to Administrators</option>
                  <option value="Blocked">Block Completely</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">File Download Policies (PDFs/Images)</label>
                <select {...register('downloadRestrictions')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="None">No Restrictions</option>
                  <option value="Watermark">Force User Watermarks</option>
                  <option value="Blocked">Block Downloads (View Only)</option>
                </select>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer mt-2">
                <input type="checkbox" {...register('sensitiveDataMasking')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Mask PII (Phone/SSN) in UI for standard users</span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Future Ready Constraints</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('clipboardProtection')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Clipboard Protection (Disable Copy/Paste)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('screenshotWarning')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Screenshot Warnings (Mobile Apps)</span>
              </label>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data Retention (Days)</label>
                <input type="number" {...register('dataRetention')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <label className="flex items-center space-x-3 cursor-pointer mt-3">
                  <input type="checkbox" {...register('automaticDataCleanup')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Auto-purge deleted soft records after retention</span>
                </label>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
