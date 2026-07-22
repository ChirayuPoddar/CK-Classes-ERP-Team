import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BellRing } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const alertsSchema = z.object({
  multipleFailedLogins: z.array(z.string()),
  newDeviceLogin: z.array(z.string()),
  passwordChanged: z.array(z.string()),
  roleChanged: z.array(z.string()),
  permissionChanged: z.array(z.string()),
  suspiciousLogin: z.array(z.string()),
  accountLocked: z.array(z.string())
});

const CHANNELS = ['In-App', 'Email', 'SMS', 'Push'];

const ALERT_TYPES = [
  { id: 'multipleFailedLogins', label: 'Multiple Failed Logins' },
  { id: 'suspiciousLogin', label: 'Suspicious Login (New IP/Location)' },
  { id: 'newDeviceLogin', label: 'New Device Login' },
  { id: 'accountLocked', label: 'Account Locked Out' },
  { id: 'passwordChanged', label: 'Password Changed' },
  { id: 'roleChanged', label: 'User Role Changed' },
  { id: 'permissionChanged', label: 'Security Permissions Changed' }
];

export const SecurityAlertsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(alertsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('securityAlerts', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.securityAlerts);
    }
  });

  const isMatch = searchQuery && (
    'Security Alerts'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'alert'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'notify'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Automated Security Alerts"
        description="Map critical security events to notification delivery channels."
        icon={BellRing}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-4">
          
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-slate-200">
            <div className="col-span-6 md:col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Trigger</div>
            <div className="col-span-6 md:col-span-8 flex justify-between px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {CHANNELS.map(ch => <span key={ch} className="w-16 text-center">{ch}</span>)}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:divide-y sm:divide-slate-100">
            {ALERT_TYPES.map(alert => (
              <div key={alert.id} className="sm:py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="col-span-1 sm:col-span-6 md:col-span-4">
                  <span className="text-sm font-medium text-slate-900">{alert.label}</span>
                </div>
                <div className="col-span-1 sm:col-span-6 md:col-span-8 flex justify-between px-2 sm:px-4">
                  <Controller
                    name={alert.id}
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
