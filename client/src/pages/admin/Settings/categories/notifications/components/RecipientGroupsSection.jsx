import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const recipientGroupsSchema = z.object({
  administrators: z.boolean(),
  principals: z.boolean(),
  hods: z.boolean(),
  teachers: z.boolean(),
  classTeachers: z.boolean(),
  students: z.boolean(),
  parents: z.boolean(),
  departmentStaff: z.boolean()
});

export const RecipientGroupsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(recipientGroupsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('recipientGroups', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.recipientGroups);
    }
  });

  const isMatch = searchQuery && (
    'Recipient Groups'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'group'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Recipient Groups"
        description="Enable standard system groups for bulk notification targeting."
        icon={Users}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('administrators')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Administrators</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('principals')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Principals</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('hods')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">HODs</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('teachers')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Teachers</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('classTeachers')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Class Teachers</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('students')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Students</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('parents')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Parents</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" {...register('departmentStaff')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-slate-700">Department Staff</span>
            </label>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
