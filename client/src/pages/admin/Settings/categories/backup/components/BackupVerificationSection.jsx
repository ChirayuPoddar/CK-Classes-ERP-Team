import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { backupSettingsService } from '@/services/backupSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const verifySchema = z.object({
  automaticIntegrityCheck: z.boolean(),
  checksumValidation: z.boolean(),
  corruptionDetection: z.boolean(),
  recoverySimulation: z.boolean()
});

export const BackupVerificationSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => backupSettingsService.updateSection('backupVerification', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['backupSettings'], data);
      setIsEditing(false);
      reset(data.backupVerification);
    }
  });

  const isMatch = searchQuery && (
    'Backup Verification'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'verify'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'integrity'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Backup Verification & Integrity"
        description="Ensure your backups are actually restorable and free of corruption."
        icon={ShieldCheck}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('automaticIntegrityCheck')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-medium text-slate-700">Automatic Integrity Check</span>
                <span className="block text-xs text-slate-500 mt-0.5">Scans backup archives immediately after creation.</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('checksumValidation')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-medium text-slate-700">MD5/SHA-256 Checksum Validation</span>
                <span className="block text-xs text-slate-500 mt-0.5">Ensures the file on disk matches the generated stream byte-for-byte.</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('corruptionDetection')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-medium text-slate-700">Deep Database Corruption Detection</span>
                <span className="block text-xs text-slate-500 mt-0.5">Attempts to mount the database in a sandbox to verify structure. (May increase backup time).</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('recoverySimulation')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-medium text-slate-700">Monthly Auto-Recovery Simulation</span>
                <span className="block text-xs text-slate-500 mt-0.5">Automatically spins up a staging instance once a month to test a full restore cycle.</span>
              </div>
            </label>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
