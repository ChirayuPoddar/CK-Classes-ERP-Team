import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Zap } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const animationsSchema = z.object({
  pageAnimations: z.boolean(),
  cardAnimations: z.boolean(),
  hoverEffects: z.boolean(),
  loadingAnimations: z.boolean(),
  transitions: z.boolean(),
  reducedMotion: z.boolean()
});

export const AnimationsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(animationsSchema),
    defaultValues: initialData || {}
  });

  const reducedMotion = watch('reducedMotion');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('animations', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.animations);
    }
  });

  const isMatch = searchQuery && (
    'Animations'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'motion'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'hover'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Animations & Effects"
        description="Control UI motion, hover states, and transitions."
        icon={Zap}
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
                <input type="checkbox" {...register('reducedMotion')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Reduced Motion Mode</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Overrides all animation settings to disable motion for users with vestibular disorders.</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: reducedMotion ? 0.5 : 1, pointerEvents: reducedMotion ? 'none' : 'auto' }}>
              <h4 className="text-sm font-semibold text-slate-900">Core Animations</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('pageAnimations')} disabled={!isEditing || reducedMotion} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Page Load Animations</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('cardAnimations')} disabled={!isEditing || reducedMotion} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Card Entry Animations</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('loadingAnimations')} disabled={!isEditing || reducedMotion} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Advanced Loading Skeletons</span>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: reducedMotion ? 0.5 : 1, pointerEvents: reducedMotion ? 'none' : 'auto' }}>
              <h4 className="text-sm font-semibold text-slate-900">Interactions</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('hoverEffects')} disabled={!isEditing || reducedMotion} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Rich Hover Effects</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('transitions')} disabled={!isEditing || reducedMotion} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Smooth State Transitions</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
