import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Layout } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const layoutSchema = z.object({
  sidebarWidth: z.enum(['Compact', 'Default', 'Wide']),
  sidebarCollapseMode: z.enum(['Hover', 'Click']),
  navbarPosition: z.enum(['Sticky', 'Static']),
  stickyHeader: z.boolean(),
  stickySidebar: z.boolean(),
  contentWidth: z.enum(['Contained', 'Full']),
  pagePadding: z.enum(['Compact', 'Comfortable', 'Spacious']),
  cardDensity: z.enum(['Compact', 'Comfortable']),
  gridDensity: z.enum(['Compact', 'Comfortable'])
});

export const LayoutSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(layoutSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('layout', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.layout);
    }
  });

  const isMatch = searchQuery && (
    'Layout'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'sidebar'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'width'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Layout & Density"
        description="Configure sidebar behavior, navigation positioning, and content spacing."
        icon={Layout}
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
              <h4 className="text-sm font-semibold text-slate-900">Navigation & Sidebar</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sidebar Width</label>
                <select {...register('sidebarWidth')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Compact">Compact</option>
                  <option value="Default">Default</option>
                  <option value="Wide">Wide</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sidebar Collapse Mode</label>
                <select {...register('sidebarCollapseMode')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Hover">Expand on Hover</option>
                  <option value="Click">Expand on Click</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Navbar Position</label>
                <select {...register('navbarPosition')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Sticky">Sticky (Always visible)</option>
                  <option value="Static">Static (Scrolls with page)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Content & Spacing</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content Width</label>
                <select {...register('contentWidth')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Contained">Contained (Max Width)</option>
                  <option value="Full">Full Width</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Page Padding</label>
                <select {...register('pagePadding')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Compact">Compact</option>
                  <option value="Comfortable">Comfortable</option>
                  <option value="Spacious">Spacious</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Density</label>
                <select {...register('cardDensity')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Compact">Compact (Tight spacing)</option>
                  <option value="Comfortable">Comfortable (Standard spacing)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('stickyHeader')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Sticky Page Headers</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('stickySidebar')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Sticky Sub-navigation Sidebars</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
