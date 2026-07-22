import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserMinus } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const absenceSchema = z.object({
  consecutiveAbsenceThreshold: z.coerce.number().min(1, 'Threshold must be at least 1 day'),
  maximumAllowedAbsences: z.coerce.number().min(1, 'Limit must be at least 1 day'),
  excusedCategories: z.array(z.string()).min(1, 'Select at least one category'),
  medicalLeave: z.boolean(),
  sportsLeave: z.boolean(),
  officialDuty: z.boolean(),
  customLeaveTypes: z.string().optional(),
  automaticParentAlerts: z.boolean(),
  automaticTeacherAlerts: z.boolean()
});

const EXCUSED_CATEGORIES = ['Medical', 'Sports', 'Official Duty', 'Family Emergency', 'Religious', 'Other'];

export const AbsenceRulesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(absenceSchema),
    defaultValues: initialData || { excusedCategories: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('absenceRules', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.absenceRules);
    }
  });

  const isMatch = searchQuery && (
    'Absence Rules'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'absent'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Absence Rules"
        description="Configure thresholds, excused leaves, and automated alerting for chronic absenteeism."
        icon={UserMinus}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Consecutive Absence Threshold (Days) *</label>
              <input
                type="number"
                {...register('consecutiveAbsenceThreshold')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.consecutiveAbsenceThreshold && <p className="mt-1 text-sm text-red-600">{errors.consecutiveAbsenceThreshold.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maximum Allowed Absences (per Term/Year) *</label>
              <input
                type="number"
                {...register('maximumAllowedAbsences')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.maximumAllowedAbsences && <p className="mt-1 text-sm text-red-600">{errors.maximumAllowedAbsences.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Excused Absence Categories *</label>
              <Controller
                name="excusedCategories"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {EXCUSED_CATEGORIES.map(category => {
                      const isSelected = field.value?.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const newValue = isSelected
                              ? field.value.filter(c => c !== category)
                              : [...(field.value || []), category];
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
                          {category}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.excusedCategories && <p className="mt-1 text-sm text-red-600">{errors.excusedCategories.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Custom Leave Types (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g., Competition, Workshop"
                {...register('customLeaveTypes')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('medicalLeave')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Medical Leave Workflow</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('sportsLeave')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Sports Leave Workflow</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('officialDuty')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Official Duty Workflow</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('automaticParentAlerts')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Send Auto Alerts to Parents</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('automaticTeacherAlerts')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Send Auto Alerts to Teachers</span>
              </label>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
