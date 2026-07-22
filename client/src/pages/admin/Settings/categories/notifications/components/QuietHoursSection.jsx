import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Moon } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const quietHoursSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  weekendRules: z.enum(['Strict (Block All)', 'Relaxed (Allow Important)', 'None']),
  holidayRules: z.enum(['Strict (Block All)', 'Relaxed (Allow Important)', 'None']),
  emergencyOverride: z.boolean(),
  priorityIgnore: z.boolean()
});

export const QuietHoursSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(quietHoursSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('quietHours', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.quietHours);
    }
  });

  const isMatch = searchQuery && (
    'Quiet Hours'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'time'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'night'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Quiet Hours"
        description="Configure time periods where notifications are suppressed or delayed."
        icon={Moon}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiet Hours Start Time</label>
              <input type="time" {...register('startTime')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiet Hours End Time</label>
              <input type="time" {...register('endTime')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weekend Rules</label>
              <select {...register('weekendRules')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Strict (Block All)">Strict (Block All Non-Emergency)</option>
                <option value="Relaxed (Allow Important)">Relaxed (Allow Important)</option>
                <option value="None">None (Send Normally)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Holiday Rules</label>
              <select {...register('holidayRules')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Strict (Block All)">Strict (Block All Non-Emergency)</option>
                <option value="Relaxed (Allow Important)">Relaxed (Allow Important)</option>
                <option value="None">None (Send Normally)</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('emergencyOverride')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow System Emergencies to Override Quiet Hours</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('priorityIgnore')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow "High Priority" channel alerts to ignore Quiet Hours</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
