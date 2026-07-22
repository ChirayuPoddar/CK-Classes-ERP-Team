import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sliders } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const defaultsSchema = z.object({
  defaultAttendancePercentage: z.coerce.number().min(1).max(100),
  defaultClassDuration: z.coerce.number().min(15).max(240),
  defaultSession: z.enum(['Morning', 'Afternoon', 'Evening', 'Full Day']),
  defaultStatus: z.enum(['Present', 'Absent', 'Not Marked']),
  defaultRemarks: z.string().optional(),
  defaultFilters: z.enum(['Class-wise', 'Section-wise', 'Subject-wise'])
});

export const DefaultsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(defaultsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('defaults', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.defaults);
    }
  });

  const isMatch = searchQuery && (
    'Defaults'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'preset'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Global Defaults"
        description="Configure default values pre-filled across the Attendance module."
        icon={Sliders}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Attendance % *</label>
              <input
                type="number"
                {...register('defaultAttendancePercentage')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.defaultAttendancePercentage && <p className="mt-1 text-sm text-red-600">{errors.defaultAttendancePercentage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Class Duration (mins) *</label>
              <input
                type="number"
                {...register('defaultClassDuration')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.defaultClassDuration && <p className="mt-1 text-sm text-red-600">{errors.defaultClassDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Session *</label>
              <select {...register('defaultSession')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Mark Status *</label>
              <select {...register('defaultStatus')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Not Marked">Not Marked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Dashboard View *</label>
              <select {...register('defaultFilters')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Class-wise">Class-wise View</option>
                <option value="Section-wise">Section-wise View</option>
                <option value="Subject-wise">Subject-wise View</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default General Remarks</label>
              <input
                type="text"
                placeholder="e.g., Attendance recorded successfully"
                {...register('defaultRemarks')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
