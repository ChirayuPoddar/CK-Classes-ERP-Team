import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const lateSchema = z.object({
  lateThreshold: z.coerce.number().min(1, 'Must be at least 1 minute'),
  veryLateThreshold: z.coerce.number().min(1, 'Must be at least 1 minute'),
  earlyLeaveThreshold: z.coerce.number().min(1, 'Must be at least 1 minute'),
  gracePeriod: z.coerce.number().min(0, 'Cannot be negative'),
  markHalfDayAfter: z.coerce.number().min(1, 'Must be at least 1 minute'),
  automaticStatusCalculation: z.boolean(),
  allowManualOverride: z.boolean()
}).refine(data => data.veryLateThreshold > data.lateThreshold, {
  message: "Very Late threshold must be greater than Late threshold",
  path: ["veryLateThreshold"]
});

export const LateArrivalSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(lateSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('lateArrival', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.lateArrival);
    }
  });

  const isMatch = searchQuery && (
    'Late Arrival & Early Leave'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'late'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Late Arrival & Early Leave"
        description="Set automated thresholds for tardiness and half-day calculations."
        icon={Clock}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grace Period (mins) *</label>
              <input
                type="number"
                {...register('gracePeriod')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.gracePeriod && <p className="mt-1 text-sm text-red-600">{errors.gracePeriod.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Late Threshold (mins) *</label>
              <input
                type="number"
                {...register('lateThreshold')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.lateThreshold && <p className="mt-1 text-sm text-red-600">{errors.lateThreshold.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Very Late Threshold (mins) *</label>
              <input
                type="number"
                {...register('veryLateThreshold')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.veryLateThreshold && <p className="mt-1 text-sm text-red-600">{errors.veryLateThreshold.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Early Leave Threshold (mins) *</label>
              <input
                type="number"
                {...register('earlyLeaveThreshold')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.earlyLeaveThreshold && <p className="mt-1 text-sm text-red-600">{errors.earlyLeaveThreshold.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mark Half Day After (mins) *</label>
              <input
                type="number"
                {...register('markHalfDayAfter')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.markHalfDayAfter && <p className="mt-1 text-sm text-red-600">{errors.markHalfDayAfter.message}</p>}
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('automaticStatusCalculation')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Calculate Status Automatically via biometric/gate scans</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('allowManualOverride')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Manual Status Override by Teachers</span>
              </label>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
