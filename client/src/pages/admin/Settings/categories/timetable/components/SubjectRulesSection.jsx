import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BookOpen } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const subjectRulesSchema = z.object({
  maxClassesPerWeek: z.coerce.number().min(1).max(20),
  minClassesPerWeek: z.coerce.number().min(1).max(20),
  preferPracticalAfternoon: z.boolean()
});

export const SubjectRulesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(subjectRulesSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('subjectRules', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.subjectRules);
    }
  });

  const isMatch = searchQuery && (
    'Subject Rules'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'subject'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Subject Rules"
        description="Configure frequency limits and preferred time slots for subjects."
        icon={BookOpen}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Classes / Week (Per Subject)</label>
              <input type="number" {...register('maxClassesPerWeek')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.maxClassesPerWeek && <p className="mt-1 text-sm text-red-600">{errors.maxClassesPerWeek.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Classes / Week (Per Subject)</label>
              <input type="number" {...register('minClassesPerWeek')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.minClassesPerWeek && <p className="mt-1 text-sm text-red-600">{errors.minClassesPerWeek.message}</p>}
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('preferPracticalAfternoon')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Prefer Practical/Lab Sessions in Afternoon</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
