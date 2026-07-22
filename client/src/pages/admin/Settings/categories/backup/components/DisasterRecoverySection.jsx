import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldAlert } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { backupSettingsService } from '@/services/backupSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const drSchema = z.object({
  rpo: z.coerce.number().min(1).max(168),
  rto: z.coerce.number().min(1).max(168),
  emergencyContacts: z.string().min(5),
  recoveryTestSchedule: z.enum(['Monthly', 'Quarterly', 'Annually'])
});

export const DisasterRecoverySection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(drSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => backupSettingsService.updateSection('disasterRecovery', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['backupSettings'], data);
      setIsEditing(false);
      reset(data.disasterRecovery);
    }
  });

  const isMatch = searchQuery && (
    'Disaster Recovery'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'rpo'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'rto'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Disaster Recovery Planning"
        description="Set formal RPO/RTO targets and define emergency communication channels."
        icon={ShieldAlert}
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
              <h4 className="text-sm font-semibold text-slate-900">Service Level Objectives</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Recovery Point Objective (RPO) - Hours</label>
                <input type="number" {...register('rpo')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Maximum acceptable amount of data loss measured in time.</p>
                {errors.rpo && <p className="mt-1 text-xs text-red-600">{errors.rpo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Recovery Time Objective (RTO) - Hours</label>
                <input type="number" {...register('rto')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Maximum acceptable downtime before system is restored.</p>
                {errors.rto && <p className="mt-1 text-xs text-red-600">{errors.rto.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Preparedness</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Emergency Contacts (Email)</label>
                <textarea {...register('emergencyContacts')} disabled={!isEditing} rows="2" placeholder="Comma separated emails" className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Recovery Drill Schedule</label>
                <select {...register('recoveryTestSchedule')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
