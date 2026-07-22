import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Accessibility } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const accessSchema = z.object({
  highContrast: z.boolean(),
  largeText: z.boolean(),
  keyboardNavigation: z.boolean(),
  focusIndicators: z.boolean(),
  colorBlindPalette: z.enum(['None', 'Protanopia', 'Deuteranopia', 'Tritanopia']),
  screenReaderLabels: z.boolean()
});

export const AccessibilitySection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(accessSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('accessibility', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.accessibility);
    }
  });

  const isMatch = searchQuery && (
    'Accessibility'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'contrast'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Accessibility (a11y)"
        description="Configure inclusive design settings for all users."
        icon={Accessibility}
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
                <input type="checkbox" {...register('highContrast')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">High Contrast Mode</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('largeText')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enforce Large Text Globally</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('keyboardNavigation')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enhanced Keyboard Navigation</span>
              </label>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('focusIndicators')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Strong Focus Indicators</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('screenReaderLabels')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Verbose Screen Reader Labels</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 mt-4">Color Blind Friendly Palette</label>
                <select {...register('colorBlindPalette')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="None">None (Standard)</option>
                  <option value="Protanopia">Protanopia (Red-Blind)</option>
                  <option value="Deuteranopia">Deuteranopia (Green-Blind)</option>
                  <option value="Tritanopia">Tritanopia (Blue-Blind)</option>
                </select>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
