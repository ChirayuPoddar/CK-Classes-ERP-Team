import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const timetableSchema = z.object({
  published: z.boolean(),
  updated: z.boolean(),
  roomChanged: z.boolean(),
  teacherChanged: z.boolean(),
  periodCancelled: z.boolean(),
  extraClassAdded: z.boolean(),
  holidayAdded: z.boolean(),
  substitutionAssigned: z.boolean(),
  recipients: z.array(z.string()).min(1, 'Select at least one recipient group')
});

const RECIPIENTS = ['Students', 'Parents', 'Teachers', 'Class Teachers', 'HOD', 'Administrators'];

export const TimetableNotificationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(timetableSchema),
    defaultValues: initialData || { recipients: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('timetable', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.timetable);
    }
  });

  const isMatch = searchQuery && (
    'Timetable Notifications'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'timetable'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Timetable Notifications"
        description="Configure triggers for schedule changes, room swaps, and substitutions."
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
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Schedule Events</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('published')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Timetable Published</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('updated')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Timetable Updated</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('periodCancelled')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Period Cancelled</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('extraClassAdded')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Extra Class Added</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('holidayAdded')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Holiday Added</span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Resource Events</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('roomChanged')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Room Changed</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('teacherChanged')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Teacher Changed</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('substitutionAssigned')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Substitution Assigned</span>
              </label>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Default Recipients *</label>
              <Controller
                name="recipients"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {RECIPIENTS.map((recipient) => {
                      const isSelected = field.value?.includes(recipient);
                      return (
                        <button
                          key={recipient}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const newValue = isSelected
                              ? field.value.filter(r => r !== recipient)
                              : [...(field.value || []), recipient];
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
                          {recipient}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.recipients && <p className="mt-1 text-sm text-red-600">{errors.recipients.message}</p>}
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
