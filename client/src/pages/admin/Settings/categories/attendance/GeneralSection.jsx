import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const generalSchema = z.object({
  attendanceMode: z.enum(['Daily', 'Period-wise', 'Subject-wise']),
  defaultStatus: z.enum(['Present', 'Absent', 'Not Marked']),
  allowMultipleSessions: z.boolean(),
  windowStartTime: z.string().min(1, 'Required'),
  windowEndTime: z.string().min(1, 'Required'),
  autoSaveDrafts: z.boolean(),
  requireSubmission: z.boolean(),
  enableHistory: z.boolean()
});

export const GeneralSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('general', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.general);
    }
  });

  const isMatch = searchQuery && (
    'General Attendance'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'mode'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="General Attendance"
        description="Configure fundamental attendance modes, defaults, and session windows."
        icon={Settings}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attendance Mode *</label>
              <select
                {...register('attendanceMode')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
              >
                <option value="Daily">Daily</option>
                <option value="Period-wise">Period-wise</option>
                <option value="Subject-wise">Subject-wise</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Attendance Status *</label>
              <select
                {...register('defaultStatus')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Not Marked">Not Marked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attendance Window Start Time *</label>
              <input
                type="time"
                {...register('windowStartTime')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.windowStartTime && <p className="mt-1 text-sm text-red-600">{errors.windowStartTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attendance Window End Time *</label>
              <input
                type="time"
                {...register('windowEndTime')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.windowEndTime && <p className="mt-1 text-sm text-red-600">{errors.windowEndTime.message}</p>}
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('allowMultipleSessions')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Multiple Attendance Sessions</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoSaveDrafts')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Auto Save Drafts</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireSubmission')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require Explicit Submission</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enableHistory')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Attendance Edit History</span>
              </label>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
