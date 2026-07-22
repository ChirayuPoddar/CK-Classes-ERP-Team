import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BookOpen } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const academicSchema = z.object({
  currentYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  schoolStartTime: z.string().min(1, 'Start time is required'),
  schoolEndTime: z.string().min(1, 'End time is required'),
  weekStartsOn: z.string().min(1, 'Required'),
  academicSession: z.string().min(1, 'Required'),
  defaultAttendancePercentage: z.coerce.number().min(1).max(100),
  defaultClassDuration: z.coerce.number().min(15).max(180),
  defaultBreakDuration: z.coerce.number().min(5).max(60),
  lunchBreakDuration: z.coerce.number().min(15).max(120),
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AcademicSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(academicSchema),
    defaultValues: initialData || { workingDays: [] }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('academic', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.academic);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  const isMatch = searchQuery && (
    'Academic Configuration'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Manage academic calendar, working days, and timetable defaults'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Academic Configuration"
        description="Manage academic calendar, working days, and timetable defaults."
        icon={BookOpen}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Academic Year *</label>
              <input
                type="text"
                placeholder="e.g., 2026-2027"
                {...register('currentYear')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.currentYear && <p className="mt-1 text-sm text-red-600">{errors.currentYear.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Semester / Term *</label>
              <input
                type="text"
                placeholder="e.g., Fall, Semester 1"
                {...register('semester')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Working Days *</label>
              <Controller
                name="workingDays"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const isSelected = field.value?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const newValue = isSelected
                              ? field.value.filter(d => d !== day)
                              : [...(field.value || []), day];
                            field.onChange(newValue);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                            isSelected 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                            !isEditing && "cursor-default"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.workingDays && <p className="mt-1 text-sm text-red-600">{errors.workingDays.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Start Time *</label>
              <input
                type="time"
                {...register('schoolStartTime')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">School End Time *</label>
              <input
                type="time"
                {...register('schoolEndTime')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Week Starts On *</label>
              <select
                {...register('weekStartsOn')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Academic Session *</label>
              <select
                {...register('academicSession')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Attendance Requirement (%) *</label>
              <input
                type="number"
                {...register('defaultAttendancePercentage')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Class Duration (mins) *</label>
              <input
                type="number"
                {...register('defaultClassDuration')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Break Duration (mins) *</label>
              <input
                type="number"
                {...register('defaultBreakDuration')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lunch Break Duration (mins) *</label>
              <input
                type="number"
                {...register('lunchBreakDuration')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
