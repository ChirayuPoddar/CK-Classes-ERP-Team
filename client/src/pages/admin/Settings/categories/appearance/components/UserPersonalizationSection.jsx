import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserCheck } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const personalizationSchema = z.object({
  profileTheme: z.enum(['Organization Default', 'Light', 'Dark', 'System']),
  defaultLandingPage: z.enum(['Dashboard', 'Timetable', 'Attendance', 'Messages']),
  quickAccess: z.boolean()
});

export const UserPersonalizationSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(personalizationSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('personalization', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.personalization);
    }
  });

  const isMatch = searchQuery && (
    'User Personalization'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'profile'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'landing'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="My Personalization"
        description="Override organization defaults with your own preferences (if permitted)."
        icon={UserCheck}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">My Theme Override</label>
                <select {...register('profileTheme')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Organization Default">Organization Default</option>
                  <option value="Light">Always Light</option>
                  <option value="Dark">Always Dark</option>
                  <option value="System">Sync with OS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Landing Page</label>
                <select {...register('defaultLandingPage')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Dashboard">Dashboard</option>
                  <option value="Timetable">Timetable</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Messages">Messages</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer mt-7">
                <input type="checkbox" {...register('quickAccess')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Quick Access Shortcuts (Cmd+K)</span>
              </label>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mt-4">
                <p className="text-xs text-slate-500">Note: Modifying settings here will only affect your account (`admin`). Organization defaults remain intact for other users.</p>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
