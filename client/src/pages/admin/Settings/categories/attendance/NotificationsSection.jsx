import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const notificationSchema = z.object({
  notifyStudents: z.boolean(),
  notifyParents: z.boolean(),
  notifyTeachers: z.boolean(),
  attendanceReminder: z.boolean(),
  lowAttendanceWarning: z.boolean(),
  lateArrivalAlert: z.boolean(),
  attendanceLockedNotification: z.boolean(),
  approvalNotification: z.boolean(),
  channels: z.array(z.string()).min(1, 'Select at least one notification channel')
});

const CHANNELS = ['In-App', 'Email', 'SMS', 'Push Notification'];

export const NotificationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: initialData || { channels: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('notifications', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.notifications);
    }
  });

  const isMatch = searchQuery && (
    'Notifications'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'alert'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Notifications & Alerts"
        description="Configure automated messaging rules for attendance events."
        icon={Bell}
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notification Channels *</label>
              <Controller
                name="channels"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((channel) => {
                      const isSelected = field.value?.includes(channel);
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const newValue = isSelected
                              ? field.value.filter(c => c !== channel)
                              : [...(field.value || []), channel];
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
                          {channel}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.channels && <p className="mt-1 text-sm text-red-600">{errors.channels.message}</p>}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900">Target Audiences</h4>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" {...register('notifyStudents')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Students</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" {...register('notifyParents')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Parents</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" {...register('notifyTeachers')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Teachers</span>
                </label>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-semibold text-slate-900">Automated Triggers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('attendanceReminder')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Marking Reminder (Teachers)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('lowAttendanceWarning')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Low Attendance Warning</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('lateArrivalAlert')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Late Arrival Alert</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('attendanceLockedNotification')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Attendance Locked</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('approvalNotification')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Approval Workflows</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
