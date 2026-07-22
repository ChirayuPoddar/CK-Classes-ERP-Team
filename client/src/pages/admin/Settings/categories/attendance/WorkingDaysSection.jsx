import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const workingDaysSchema = z.object({
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  weekendRules: z.enum(['Strict', 'Flexible', 'None']),
  holidayIntegration: z.boolean(),
  halfDayRules: z.boolean(),
  specialWorkingDays: z.boolean(),
  examAttendanceRules: z.enum(['Normal', 'Separate', 'Disabled']),
  vacationHandling: z.enum(['Include', 'Exclude']),
  allowAttendanceDuringHolidays: z.boolean()
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WorkingDaysSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(workingDaysSchema),
    defaultValues: initialData || { workingDays: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('workingDays', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.workingDays);
    }
  });

  const isMatch = searchQuery && (
    'Working Days & Calendar'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'calendar'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Working Days & Calendar"
        description="Configure standard working days, weekend logic, and holiday interactions."
        icon={Calendar}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Standard Working Days *</label>
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weekend Rules *</label>
              <select {...register('weekendRules')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Strict">Strict (Block Attendance)</option>
                <option value="Flexible">Flexible (Warn Only)</option>
                <option value="None">None (Allow Freely)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam Attendance Rules *</label>
              <select {...register('examAttendanceRules')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Normal">Normal (Standard Rules)</option>
                <option value="Separate">Separate (Exam Rules Apply)</option>
                <option value="Disabled">Disabled during Exams</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vacation Handling *</label>
              <select {...register('vacationHandling')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Include">Include in Total Days</option>
                <option value="Exclude">Exclude from Total Days</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('holidayIntegration')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Sync with Holiday Calendar</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('allowAttendanceDuringHolidays')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow Attendance During Holidays</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('halfDayRules')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Half-Day Calculations</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('specialWorkingDays')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Support Special Working Days</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
