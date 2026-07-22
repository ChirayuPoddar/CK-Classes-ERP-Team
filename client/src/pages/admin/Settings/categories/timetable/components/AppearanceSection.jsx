import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Palette } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const appearanceSchema = z.object({
  compactMode: z.boolean(),
  rowHeight: z.enum(['Small', 'Medium', 'Large']),
  gridDensity: z.enum(['Compact', 'Comfortable', 'Spacious']),
  weekendHighlighting: z.boolean(),
  currentPeriodHighlight: z.boolean(),
  stickyHeaders: z.boolean(),
  colorCoding: z.enum(['Subject Based', 'Teacher Based', 'Room Based', 'None'])
});

export const AppearanceSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(appearanceSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('appearance', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.appearance);
    }
  });

  const isMatch = searchQuery && (
    'Timetable Appearance'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'color'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Timetable Appearance"
        description="Configure colors, row heights, and visual grid settings."
        icon={Palette}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Row Height</label>
              <select {...register('rowHeight')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grid Density</label>
              <select {...register('gridDensity')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Compact">Compact</option>
                <option value="Comfortable">Comfortable</option>
                <option value="Spacious">Spacious</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color Coding Strategy</label>
              <select {...register('colorCoding')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Subject Based">Subject Based</option>
                <option value="Teacher Based">Teacher Based</option>
                <option value="Room Based">Room Based</option>
                <option value="None">Monochrome (None)</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('compactMode')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Compact UI Mode</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('weekendHighlighting')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Highlight Weekends</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('currentPeriodHighlight')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Highlight Current Period (Live)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('stickyHeaders')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Use Sticky Headers while Scrolling</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
