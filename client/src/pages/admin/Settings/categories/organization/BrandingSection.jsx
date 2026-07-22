import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Palette, ImageIcon } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  faviconUrl: z.string().optional(),
  emailLogoUrl: z.string().optional(),
  reportLogoUrl: z.string().optional(),
  certificateLogoUrl: z.string().optional()
});

export const BrandingSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: initialData || {}
  });

  const pColor = watch('primaryColor');
  const sColor = watch('secondaryColor');
  const aColor = watch('accentColor');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('branding', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.branding);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  const isMatch = searchQuery && (
    'Branding'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Manage colors, logos, and UI themes'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Branding & Appearance"
        description="Configure colors, system logos, and UI themes."
        icon={Palette}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('primaryColor')}
                  className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                />
                <input
                  type="text"
                  {...register('primaryColor')}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono uppercase"
                />
              </div>
              {errors.primaryColor && <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('secondaryColor')}
                  className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                />
                <input
                  type="text"
                  {...register('secondaryColor')}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('accentColor')}
                  className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                />
                <input
                  type="text"
                  {...register('accentColor')}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono uppercase"
                />
              </div>
            </div>

            {/* Theme Preview */}
            <div className="md:col-span-3 mt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Live Theme Preview</label>
              <div 
                className="w-full h-32 rounded-xl border border-slate-200 shadow-sm flex overflow-hidden"
                style={{ backgroundColor: sColor || '#f1f5f9' }}
              >
                <div 
                  className="w-16 h-full flex flex-col items-center py-4 gap-4"
                  style={{ backgroundColor: pColor || '#4f46e5' }}
                >
                  <div className="w-8 h-8 rounded bg-white/20" />
                  <div className="w-8 h-8 rounded bg-white/20" />
                  <div className="w-8 h-8 rounded bg-white/20" />
                </div>
                <div className="flex-1 p-6 relative">
                  <div className="w-1/3 h-4 bg-slate-200 rounded mb-4" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded mb-4" />
                  <button 
                    type="button" 
                    className="absolute bottom-6 right-6 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm"
                    style={{ backgroundColor: aColor || '#f59e0b' }}
                  >
                    Action Button
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Specific Logos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Favicon', name: 'faviconUrl' },
                  { label: 'Email Logo', name: 'emailLogoUrl' },
                  { label: 'Report Logo', name: 'reportLogoUrl' },
                  { label: 'Certificate Logo', name: 'certificateLogoUrl' }
                ].map((item) => (
                  <div key={item.name}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{item.label}</label>
                    <div className="relative group w-full h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 mb-2 overflow-hidden">
                      {watch(item.name) ? (
                        <img src={watch(item.name)} alt={item.label} className="w-full h-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    {isEditing && (
                      <input
                        type="text"
                        placeholder="Image URL"
                        {...register(item.name)}
                        className="block w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
