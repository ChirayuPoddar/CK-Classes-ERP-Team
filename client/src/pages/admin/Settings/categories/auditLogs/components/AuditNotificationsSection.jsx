import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { auditLogsService } from '@/services/auditLogsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const notificationsSchema = z.object({
  criticalEvents: z.array(z.string()),
  securityEvents: z.array(z.string()),
  massDeletions: z.array(z.string())
});

const CHANNELS = ['In-App', 'Email', 'SMS'];

const EVENT_TYPES = [
  { id: 'criticalEvents', label: 'Any "Critical" Severity Event' },
  { id: 'securityEvents', label: 'Suspicious Activity / Failed Logins' },
  { id: 'massDeletions', label: 'Mass Deletions (>50 records)' }
];

export const AuditNotificationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(notificationsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => auditLogsService.updateSettings('notifications', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auditSettings'], data);
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
        title="Audit & Security Alerts"
        description="Configure real-time notifications for highly sensitive system events."
        icon={Bell}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-4">
          
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-slate-200">
            <div className="col-span-6 md:col-span-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger Rule</div>
            <div className="col-span-6 md:col-span-6 flex justify-between px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {CHANNELS.map(ch => <span key={ch} className="w-16 text-center">{ch}</span>)}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:divide-y sm:divide-slate-100">
            {EVENT_TYPES.map(eventType => (
              <div key={eventType.id} className="sm:py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="col-span-1 sm:col-span-6 md:col-span-6">
                  <span className="text-sm font-medium text-slate-900">{eventType.label}</span>
                </div>
                <div className="col-span-1 sm:col-span-6 md:col-span-6 flex justify-between px-2 sm:px-4">
                  <Controller
                    name={eventType.id}
                    control={control}
                    render={({ field }) => (
                      <>
                        {CHANNELS.map(channel => {
                          const isSelected = field.value?.includes(channel);
                          return (
                            <label key={channel} className="flex flex-col items-center cursor-pointer w-16">
                              <span className="sm:hidden text-[10px] text-slate-400 mb-1">{channel}</span>
                              <input
                                type="checkbox"
                                disabled={!isEditing}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (!isEditing) return;
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), channel]
                                    : (field.value || []).filter(c => c !== channel);
                                  field.onChange(newValue);
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                              />
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

        </form>
      </SectionCard>
    </div>
  );
};
