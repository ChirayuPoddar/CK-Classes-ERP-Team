import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const generalSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  timetableType: z.enum(['Weekly', 'Rotating', 'Semester-wise']),
  defaultView: z.enum(['Class-wise', 'Teacher-wise', 'Room-wise']),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  maxPeriodsPerDay: z.coerce.number().min(1).max(20),
  maxPeriodsPerWeek: z.coerce.number().min(1).max(100),
  defaultClassDuration: z.coerce.number().min(15).max(180)
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const GeneralSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: initialData || { workingDays: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('general', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.general);
    }
  });

  const isMatch = searchQuery && (
    'General Timetable'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'academic year'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="General Timetable"
        description="Configure core academic year, school hours, and default views."
        icon={Calendar}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Academic Year *</label>
              <select {...register('academicYear')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester/Term *</label>
              <select {...register('semester')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Full Year">Full Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Timetable Type *</label>
              <select {...register('timetableType')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Weekly">Weekly Standard</option>
                <option value="Rotating">A/B Rotating Schedule</option>
                <option value="Semester-wise">Semester-wise Fixed</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Working Days *</label>
              <Controller
                name="workingDays"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
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
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                            !isEditing && "cursor-default opacity-70"
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

            <div className="md:col-span-3 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Start Time *</label>
                <input type="time" {...register('startTime')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">School End Time *</label>
                <input type="time" {...register('endTime')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default View *</label>
                <select {...register('defaultView')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                  <option value="Class-wise">Class-wise</option>
                  <option value="Teacher-wise">Teacher-wise</option>
                  <option value="Room-wise">Room-wise</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Periods / Day</label>
                <input type="number" {...register('maxPeriodsPerDay')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Periods / Week</label>
                <input type="number" {...register('maxPeriodsPerWeek')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Class Duration (mins)</label>
                <input type="number" {...register('defaultClassDuration')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
