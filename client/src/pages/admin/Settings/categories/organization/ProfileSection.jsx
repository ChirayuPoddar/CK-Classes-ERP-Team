import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  shortName: z.string().min(2, 'Short name is required'),
  tagline: z.string().optional(),
  schoolType: z.string().min(1, 'School type is required'),
  affiliationBoard: z.string().min(1, 'Affiliation board is required'),
  institutionCode: z.string().min(2, 'Institution code is required'),
  registrationNumber: z.string().optional(),
  establishedYear: z.coerce.number().min(1800).max(new Date().getFullYear()),
  principalName: z.string().min(2, 'Principal name is required'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional()
});

export const ProfileSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData || {}
  });

  const logoUrl = watch('logoUrl');
  const bannerUrl = watch('bannerUrl');

  // Reset form when initialData changes (e.g., loaded from API)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('profile', data),
    onSuccess: (data) => {
      // In a real app, toast.success('Profile updated')
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.profile);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  // Highlighting/Search Logic
  const isMatch = searchQuery && (
    'Organization Profile'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Manage basic institution details'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Organization Profile"
        description="Manage basic institution details, branding assets, and official identifiers."
        icon={Building2}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          {/* Logo & Banner Preview Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">School Logo</label>
              <div className="relative group w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <UploadCloud className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              {isEditing && (
                <input
                  type="text"
                  placeholder="Logo URL"
                  {...register('logoUrl')}
                  className="mt-2 block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">School Banner</label>
              <div className="relative group w-full h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-500">Banner Image</span>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <UploadCloud className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              {isEditing && (
                <input
                  type="text"
                  placeholder="Banner URL"
                  {...register('bannerUrl')}
                  className="mt-2 block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Name *</label>
              <input
                type="text"
                {...register('schoolName')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.schoolName && <p className="mt-1 text-sm text-red-600">{errors.schoolName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Name *</label>
              <input
                type="text"
                {...register('shortName')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.shortName && <p className="mt-1 text-sm text-red-600">{errors.shortName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tagline / Motto</label>
              <input
                type="text"
                {...register('tagline')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Type *</label>
              <select
                {...register('schoolType')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
              >
                <option value="">Select Type</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="High School">High School</option>
                <option value="College">College</option>
                <option value="University">University</option>
              </select>
              {errors.schoolType && <p className="mt-1 text-sm text-red-600">{errors.schoolType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Affiliation Board *</label>
              <input
                type="text"
                {...register('affiliationBoard')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.affiliationBoard && <p className="mt-1 text-sm text-red-600">{errors.affiliationBoard.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Institution Code *</label>
              <input
                type="text"
                {...register('institutionCode')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.institutionCode && <p className="mt-1 text-sm text-red-600">{errors.institutionCode.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
              <input
                type="text"
                {...register('registrationNumber')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Established Year</label>
              <input
                type="number"
                {...register('establishedYear')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.establishedYear && <p className="mt-1 text-sm text-red-600">{errors.establishedYear.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Principal / Head Name *</label>
              <input
                type="text"
                {...register('principalName')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.principalName && <p className="mt-1 text-sm text-red-600">{errors.principalName.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description / About School</label>
              <textarea
                rows={3}
                {...register('description')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
              />
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
