import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertOctagon } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const constraintsSchema = z.object({
  teacherConflict: z.boolean(),
  studentConflict: z.boolean(),
  roomConflict: z.boolean(),
  noDuplicatePeriods: z.boolean(),
  noEmptyTimetable: z.boolean()
});

export const ConstraintsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(constraintsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('constraints', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.constraints);
    }
  });

  const isMatch = searchQuery && (
    'Constraints'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'conflict'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Hard Constraints"
        description="Global non-negotiable rules for timetable validation."
        icon={AlertOctagon}
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
              <input type="checkbox" {...register('teacherConflict')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Prevent Teacher Conflicts</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('studentConflict')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Prevent Student Conflicts</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('roomConflict')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Prevent Room Conflicts</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('noDuplicatePeriods')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Prevent Duplicate Periods in Same Day</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('noEmptyTimetable')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Prevent Empty Days</span>
            </label>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
