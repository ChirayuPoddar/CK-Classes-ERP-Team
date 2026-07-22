import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LayoutGrid } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const classPoolSchema = z.object({
  enableDragDrop: z.boolean(),
  allowMultiSelect: z.boolean(),
  allowDuplicateClasses: z.boolean(),
  autoSort: z.boolean(),
  horizontalLayout: z.boolean(),
  showTeacherNames: z.boolean(),
  showSubjectColors: z.boolean()
});

export const ClassPoolSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(classPoolSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('classPool', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.classPool);
    }
  });

  const isMatch = searchQuery && (
    'Class Pool Settings'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'pool'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Class Pool Settings"
        description="Configure the drag & drop interface for manual timetable building."
        icon={LayoutGrid}
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
              <input type="checkbox" {...register('enableDragDrop')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Enable Drag & Drop Building</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('allowMultiSelect')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Allow Multi-Select</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('allowDuplicateClasses')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Allow Duplicate Classes in Pool</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('autoSort')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Auto Sort Available Classes</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('horizontalLayout')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Use Horizontal Layout for Pool</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('showTeacherNames')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Show Teacher Names on Blocks</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('showSubjectColors')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Show Subject Colors</span>
            </label>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
