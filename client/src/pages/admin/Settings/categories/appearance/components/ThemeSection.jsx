import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const themeSchema = z.object({
  mode: z.enum(['Light', 'Dark', 'System', 'Auto'])
});

export const ThemeSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(themeSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('theme', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.theme);
    }
  });

  const isMatch = searchQuery && (
    'Theme'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'dark'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'light'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Theme Settings"
        description="Configure the default color theme for the ERP."
        icon={Palette}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          
          <label className="block text-sm font-semibold text-slate-700 mb-4">Base Theme</label>
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'Light', icon: Sun },
                  { value: 'Dark', icon: Moon },
                  { value: 'System', icon: Monitor },
                  { value: 'Auto', icon: Sun } // Or some hybrid icon
                ].map((mode) => {
                  const isSelected = field.value === mode.value;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => field.onChange(mode.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        !isEditing && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-semibold">{mode.value}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />

        </form>
      </SectionCard>
    </div>
  );
};
