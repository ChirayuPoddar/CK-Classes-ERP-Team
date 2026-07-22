import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const autoGenSchema = z.object({
  enableAutoGeneration: z.boolean(),
  conflictDetection: z.enum(['Strict', 'Relaxed', 'None']),
  conflictResolution: z.enum(['Manual Override', 'Drop Class', 'Shift Period']),
  optimizeWorkload: z.boolean(),
  optimizeClassrooms: z.boolean(),
  balanceDailySubjects: z.boolean(),
  avoidConsecutiveSameSubject: z.boolean(),
  autoAssignRooms: z.boolean(),
  autoAssignTeachers: z.boolean(),
  priority: z.enum(['Core Subjects First', 'Senior Classes First', 'Teacher Availability First'])
});

export const AutoGenerationSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(autoGenSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('autoGeneration', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.autoGeneration);
    }
  });

  const isMatch = searchQuery && (
    'Auto-Generation'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'generate'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Auto-Generation Settings"
        description="Configure the genetic algorithm that builds automated schedules."
        icon={Settings}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="md:col-span-3">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <input type="checkbox" {...register('enableAutoGeneration')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enable AI Auto-Generation Engine</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Allows administrators to automatically generate timetables based on defined constraints.</span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conflict Detection</label>
              <select {...register('conflictDetection')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Strict">Strict (Block all errors)</option>
                <option value="Relaxed">Relaxed (Warn only)</option>
                <option value="None">None (Allow overlaps)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conflict Resolution Strategy</label>
              <select {...register('conflictResolution')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Manual Override">Require Manual Override</option>
                <option value="Drop Class">Drop Conflicting Class</option>
                <option value="Shift Period">Auto-Shift to Next Period</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Generation Priority</label>
              <select {...register('priority')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Core Subjects First">Core Subjects First</option>
                <option value="Senior Classes First">Senior Classes First</option>
                <option value="Teacher Availability First">Teacher Availability First</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('optimizeWorkload')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Optimize Teacher Workload</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('optimizeClassrooms')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Optimize Classroom Usage</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('balanceDailySubjects')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Balance Daily Subjects</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('avoidConsecutiveSameSubject')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Avoid Consecutive Same Subject</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoAssignRooms')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Auto Assign Rooms</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('autoAssignTeachers')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Auto Assign Teachers</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
