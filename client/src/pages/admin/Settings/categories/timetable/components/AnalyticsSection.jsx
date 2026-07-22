import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BarChart3 } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const analyticsSchema = z.object({
  enableAnalytics: z.boolean(),
  teacherWorkload: z.boolean(),
  roomUtilization: z.boolean(),
  conflictReports: z.boolean()
});

export const AnalyticsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(analyticsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('analytics', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.analytics);
    }
  });

  const isMatch = searchQuery && (
    'Timetable Analytics'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'chart'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'report'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Timetable Analytics"
        description="Enable advanced reporting on resource utilization and schedule efficiency."
        icon={BarChart3}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('enableAnalytics')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Enable Analytics Engine</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('teacherWorkload')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Track Teacher Workload</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('roomUtilization')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Track Room Utilization</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('conflictReports')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Generate Conflict Reports</span>
            </label>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
