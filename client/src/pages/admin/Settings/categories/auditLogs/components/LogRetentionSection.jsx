import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Archive } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { auditLogsService } from '@/services/auditLogsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const retentionSchema = z.object({
  period: z.coerce.number().min(1).max(3650),
  autoArchive: z.boolean(),
  autoDelete: z.boolean(),
  storageLimit: z.coerce.number().min(1).max(1000)
});

export const LogRetentionSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(retentionSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => auditLogsService.updateSettings('retention', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auditSettings'], data);
      setIsEditing(false);
      reset(data.retention);
    }
  });

  const isMatch = searchQuery && (
    'Retention'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'archive'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'delete'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Log Retention & Archiving"
        description="Configure how long audit logs are kept online before archiving or deletion."
        icon={Archive}
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Online Retention Period (Days)</label>
                <input type="number" {...register('period')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-[10px] text-slate-500">Logs older than this will be processed by the policies below.</p>
                {errors.period && <p className="mt-1 text-xs text-red-600">{errors.period.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dedicated Storage Limit (GB)</label>
                <input type="number" {...register('storageLimit')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                {errors.storageLimit && <p className="mt-1 text-xs text-red-600">{errors.storageLimit.message}</p>}
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoArchive')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1" />
                <div>
                  <span className="block text-sm font-medium text-slate-700">Auto-Archive to Cold Storage</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Moves expired logs to cheap, slow S3 Glacier storage instead of deleting them.</span>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoDelete')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1" />
                <div>
                  <span className="block text-sm font-medium text-slate-700">Permanent Auto-Delete</span>
                  <span className="block text-xs text-slate-500 mt-0.5 text-red-600 font-semibold">WARNING: Destroys logs completely after retention period expires.</span>
                </div>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
