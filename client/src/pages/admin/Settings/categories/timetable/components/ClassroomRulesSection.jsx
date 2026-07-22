import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2 } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const classroomRulesSchema = z.object({
  enforceCapacity: z.boolean(),
  preventConflicts: z.boolean(),
  labPriority: z.enum(['Senior Classes', 'Science Subjects', 'First Come First Serve'])
});

export const ClassroomRulesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(classroomRulesSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('classroomRules', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.classroomRules);
    }
  });

  const isMatch = searchQuery && (
    'Classroom Rules'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'room'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Classroom Rules"
        description="Configure capacity checks and priority for special rooms and labs."
        icon={Building2}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enforceCapacity')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Strictly Enforce Room Capacity</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('preventConflicts')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Prevent Room Double-Booking</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Laboratory Priority</label>
              <select {...register('labPriority')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Senior Classes">Senior Classes First</option>
                <option value="Science Subjects">Core Science Subjects</option>
                <option value="First Come First Serve">First Come First Serve</option>
              </select>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
