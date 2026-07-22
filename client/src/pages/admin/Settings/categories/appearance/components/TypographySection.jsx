import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Type } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const typographySchema = z.object({
  fontSize: z.string().min(1),
  fontFamily: z.string().min(1),
  headingScale: z.enum(['Small', 'Standard', 'Large']),
  lineHeight: z.string().min(1),
  letterSpacing: z.enum(['Tight', 'Normal', 'Wide']),
  readableMode: z.boolean()
});

export const TypographySection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(typographySchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('typography', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.typography);
    }
  });

  const isMatch = searchQuery && (
    'Typography'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'font'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'text'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Typography"
        description="Configure font families, scales, and readability settings."
        icon={Type}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <input type="checkbox" {...register('readableMode')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enhanced Readability Mode</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Automatically optimizes line height, letter spacing, and contrast for long reading sessions.</span>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Font Family</label>
                <select {...register('fontFamily')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Inter, sans-serif">Inter (Modern Sans)</option>
                  <option value="Roboto, sans-serif">Roboto (System Sans)</option>
                  <option value="'Open Sans', sans-serif">Open Sans (Legible Sans)</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono (Monospace)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Font Size</label>
                <select {...register('fontSize')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="12px">12px (Small)</option>
                  <option value="14px">14px (Standard)</option>
                  <option value="16px">16px (Large)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Heading Scale</label>
                <select {...register('headingScale')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Small">Small (Subtle hierarchy)</option>
                  <option value="Standard">Standard</option>
                  <option value="Large">Large (Pronounced hierarchy)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Line Height</label>
                <select {...register('lineHeight')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="1.25">Tight (1.25)</option>
                  <option value="1.5">Normal (1.5)</option>
                  <option value="1.75">Relaxed (1.75)</option>
                </select>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
