import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const lockingSchema = z.object({
  autoLockAttendance: z.boolean(),
  lockTime: z.string().min(1, 'Lock time is required if auto-lock is enabled'),
  manualLock: z.boolean(),
  manualUnlock: z.boolean(),
  overridePermission: z.enum(['Admin Only', 'Admin & Principal', 'HOD and above']),
  reopenAttendanceWindow: z.boolean(),
  requireReasonBeforeUnlocking: z.boolean()
});

export const LockingSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(lockingSchema),
    defaultValues: initialData || {}
  });

  const autoLock = watch('autoLockAttendance');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('locking', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.locking);
    }
  });

  const isMatch = searchQuery && (
    'Attendance Locking'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'lock'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Attendance Locking"
        description="Configure rules for finalizing and locking attendance records to prevent tampering."
        icon={Lock}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <input type="checkbox" {...register('autoLockAttendance')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-semibold text-slate-900">Auto Lock Attendance</span>
                <span className="block text-xs text-slate-500 mt-0.5">Automatically finalize attendance at a specific time daily.</span>
              </div>
            </div>

            {autoLock && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Daily Auto Lock Time *</label>
                <input
                  type="time"
                  {...register('lockTime')}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
                />
                {errors.lockTime && <p className="mt-1 text-sm text-red-600">{errors.lockTime.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unlock / Override Permission *</label>
              <select {...register('overridePermission')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Admin Only">Admin Only</option>
                <option value="Admin & Principal">Admin & Principal</option>
                <option value="HOD and above">HOD and above</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('manualLock')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Manual Lock by Teachers</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('manualUnlock')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Manual Unlock (with permission)</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('reopenAttendanceWindow')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Reopening Attendance Window</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireReasonBeforeUnlocking')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require Reason Before Unlocking</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
