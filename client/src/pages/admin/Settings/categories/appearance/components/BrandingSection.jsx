import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Paintbrush } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const brandingSchema = z.object({
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  sidebarColor: z.string().min(1),
  navbarColor: z.string().min(1),
  buttonStyle: z.enum(['Square', 'Rounded', 'Pill']),
  borderRadius: z.enum(['None', 'Small', 'Medium', 'Large']),
  cardStyle: z.enum(['Flat', 'Bordered', 'Shadow']),
  applicationName: z.string().min(1, 'Application Name is required')
});

export const BrandingSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('branding', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.branding);
    }
  });

  const isMatch = searchQuery && (
    'Branding'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'color'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Branding & Colors"
        description="Customize the organizational identity and primary color palettes."
        icon={Paintbrush}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application Name</label>
              <input type="text" {...register('applicationName')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white" />
              {errors.applicationName && <p className="mt-1 text-sm text-red-600">{errors.applicationName.message}</p>}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Core Colors</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Primary Color</label>
                  <input type="color" {...register('primaryColor')} disabled={!isEditing} className="h-8 w-14 p-0 border-0 rounded cursor-pointer disabled:opacity-50" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Secondary Color</label>
                  <input type="color" {...register('secondaryColor')} disabled={!isEditing} className="h-8 w-14 p-0 border-0 rounded cursor-pointer disabled:opacity-50" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Accent Color</label>
                  <input type="color" {...register('accentColor')} disabled={!isEditing} className="h-8 w-14 p-0 border-0 rounded cursor-pointer disabled:opacity-50" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Navigation Colors</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Sidebar Color</label>
                  <input type="color" {...register('sidebarColor')} disabled={!isEditing} className="h-8 w-14 p-0 border-0 rounded cursor-pointer disabled:opacity-50" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Navbar Color</label>
                  <input type="color" {...register('navbarColor')} disabled={!isEditing} className="h-8 w-14 p-0 border-0 rounded cursor-pointer disabled:opacity-50" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">UI Elements</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Button Style</label>
                  <select {...register('buttonStyle')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                    <option value="Square">Square</option>
                    <option value="Rounded">Rounded</option>
                    <option value="Pill">Pill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Border Radius</label>
                  <select {...register('borderRadius')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                    <option value="None">None (0px)</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Style</label>
                  <select {...register('cardStyle')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                    <option value="Flat">Flat</option>
                    <option value="Bordered">Bordered</option>
                    <option value="Shadow">Soft Shadow</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
