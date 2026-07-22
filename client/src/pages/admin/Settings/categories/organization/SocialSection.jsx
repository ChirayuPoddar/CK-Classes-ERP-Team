import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Share2, Globe, Link, MessageCircle, Hash, Video, Rss } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const socialSchema = z.object({
  facebook: z.string().url('Invalid URL').or(z.literal('')),
  instagram: z.string().url('Invalid URL').or(z.literal('')),
  linkedin: z.string().url('Invalid URL').or(z.literal('')),
  youtube: z.string().url('Invalid URL').or(z.literal('')),
  twitter: z.string().url('Invalid URL').or(z.literal('')),
  admissionPortal: z.string().url('Invalid URL').or(z.literal('')),
});

export const SocialSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(socialSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('social', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.social);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  const isMatch = searchQuery && (
    'Social Links'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Manage social media presence and external portals'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const socialLinks = [
    { label: 'Facebook', name: 'facebook', icon: Globe, placeholder: 'https://facebook.com/...' },
    { label: 'Instagram', name: 'instagram', icon: Hash, placeholder: 'https://instagram.com/...' },
    { label: 'LinkedIn', name: 'linkedin', icon: MessageCircle, placeholder: 'https://linkedin.com/...' },
    { label: 'YouTube', name: 'youtube', icon: Video, placeholder: 'https://youtube.com/...' },
    { label: 'Twitter / X', name: 'twitter', icon: Rss, placeholder: 'https://twitter.com/...' },
    { label: 'Admission Portal', name: 'admissionPortal', icon: Link, placeholder: 'https://admissions.yourschool.com' },
  ];

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Social Links & Portals"
        description="Manage social media presence and external portals."
        icon={Share2}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialLinks.map(({ label, name, icon: Icon, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    placeholder={placeholder}
                    {...register(name)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>}
              </div>
            ))}
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
