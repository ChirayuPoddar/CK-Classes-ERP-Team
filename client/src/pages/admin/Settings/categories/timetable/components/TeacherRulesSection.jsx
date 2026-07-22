import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const teacherRulesSchema = z.object({
  maxClassesPerDay: z.coerce.number().min(1).max(10),
  maxClassesPerWeek: z.coerce.number().min(1).max(50),
  minGapBetweenClasses: z.coerce.number().min(0).max(5),
  maxConsecutiveClasses: z.coerce.number().min(1).max(5),
  preferredFreePeriod: z.enum(['Morning', 'Afternoon', 'None']),
  partTimeSupport: z.boolean(),
  handleTeacherLeave: z.enum(['Auto-Substitute', 'Leave Empty', 'Manual Override'])
});

export const TeacherRulesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(teacherRulesSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('teacherRules', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.teacherRules);
    }
  });

  const isMatch = searchQuery && (
    'Teacher Rules'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'teacher'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Teacher Rules"
        description="Configure workload limits, gaps, and substitution preferences for teachers."
        icon={Users}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Classes / Day *</label>
              <input type="number" {...register('maxClassesPerDay')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.maxClassesPerDay && <p className="mt-1 text-sm text-red-600">{errors.maxClassesPerDay.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Classes / Week *</label>
              <input type="number" {...register('maxClassesPerWeek')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.maxClassesPerWeek && <p className="mt-1 text-sm text-red-600">{errors.maxClassesPerWeek.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Gap Between Classes</label>
              <input type="number" {...register('minGapBetweenClasses')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.minGapBetweenClasses && <p className="mt-1 text-sm text-red-600">{errors.minGapBetweenClasses.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Consecutive Classes</label>
              <input type="number" {...register('maxConsecutiveClasses')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.maxConsecutiveClasses && <p className="mt-1 text-sm text-red-600">{errors.maxConsecutiveClasses.message}</p>}
            </div>

            <div className="md:col-span-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Free Period</label>
                <select {...register('preferredFreePeriod')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                  <option value="Morning">Morning (First 3 Periods)</option>
                  <option value="Afternoon">Afternoon (After Lunch)</option>
                  <option value="None">No Preference</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teacher Leave Handling</label>
                <select {...register('handleTeacherLeave')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                  <option value="Auto-Substitute">Auto-Substitute Available Teacher</option>
                  <option value="Leave Empty">Leave Empty</option>
                  <option value="Manual Override">Manual Override Only</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer mt-6">
                  <input type="checkbox" {...register('partTimeSupport')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Support Part-Time Availability</span>
                </label>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
