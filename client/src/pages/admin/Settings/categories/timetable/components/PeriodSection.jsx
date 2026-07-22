import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const periodSchema = z.object({
  periodDuration: z.coerce.number().min(15).max(120),
  breakDuration: z.coerce.number().min(5).max(60),
  lunchDuration: z.coerce.number().min(20).max(120),
  shortBreaks: z.coerce.number().min(0).max(5),
  hasAssembly: z.boolean(),
  hasActivity: z.boolean(),
  allowDoublePeriods: z.boolean(),
  allowTriplePeriods: z.boolean()
});

export const PeriodSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(periodSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('period', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.period);
    }
  });

  const isMatch = searchQuery && (
    'Period Configuration'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'break'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Period Configuration"
        description="Configure period durations, break lengths, and special slots."
        icon={Clock}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Period Duration (mins) *</label>
              <input type="number" {...register('periodDuration')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.periodDuration && <p className="mt-1 text-sm text-red-600">{errors.periodDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Break Duration (mins) *</label>
              <input type="number" {...register('breakDuration')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.breakDuration && <p className="mt-1 text-sm text-red-600">{errors.breakDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lunch Duration (mins) *</label>
              <input type="number" {...register('lunchDuration')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.lunchDuration && <p className="mt-1 text-sm text-red-600">{errors.lunchDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Number of Short Breaks *</label>
              <input type="number" {...register('shortBreaks')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.shortBreaks && <p className="mt-1 text-sm text-red-600">{errors.shortBreaks.message}</p>}
            </div>

            <div className="md:col-span-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('hasAssembly')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Assembly Period</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('hasActivity')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Activity Period</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('allowDoublePeriods')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Double Periods</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('allowTriplePeriods')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Triple Periods</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
