import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Share2 } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const channelConfigSchema = z.object({
  enabled: z.boolean(),
  priority: z.enum(['High', 'Medium', 'Low']),
  retryPolicy: z.enum(['None', 'Linear', 'Exponential']),
  timeout: z.coerce.number().min(1).max(120)
});

const deliverySchema = z.object({
  inApp: channelConfigSchema,
  email: channelConfigSchema,
  sms: channelConfigSchema,
  push: channelConfigSchema,
  webhook: channelConfigSchema
});

export const DeliveryChannelsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateSection('channels', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setIsEditing(false);
      reset(data.channels);
    }
  });

  const isMatch = searchQuery && (
    'Delivery Channels'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'email'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'sms'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'push'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChannelConfig = (channelName, label) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input type="checkbox" {...register(`${channelName}.enabled`)} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-sm font-bold text-slate-900">{label}</span>
        </label>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
          <select {...register(`${channelName}.priority`)} disabled={!isEditing} className="block w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-indigo-500 text-xs bg-white">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Retry Policy</label>
          <select {...register(`${channelName}.retryPolicy`)} disabled={!isEditing} className="block w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-indigo-500 text-xs bg-white">
            <option value="None">None</option>
            <option value="Linear">Linear</option>
            <option value="Exponential">Exponential</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Timeout (s)</label>
          <input type="number" {...register(`${channelName}.timeout`)} disabled={!isEditing} className="block w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-indigo-500 text-xs bg-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Delivery Channels"
        description="Configure priority, retry logic, and timeouts for individual delivery channels."
        icon={Share2}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderChannelConfig('inApp', 'In-App Notifications')}
            {renderChannelConfig('email', 'Email (SMTP/API)')}
            {renderChannelConfig('sms', 'SMS Text Messaging')}
            {renderChannelConfig('push', 'Mobile Push Notifications')}
            {renderChannelConfig('webhook', 'Webhooks (Future Ready)')}
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
