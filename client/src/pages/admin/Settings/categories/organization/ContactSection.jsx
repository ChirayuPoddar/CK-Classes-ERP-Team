import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Phone, Mail, Globe, LifeBuoy } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const contactSchema = z.object({
  primaryEmail: z.string().email('Invalid primary email address'),
  supportEmail: z.string().email('Invalid support email address').or(z.literal('')),
  primaryPhone: z.string().min(5, 'Primary phone is required'),
  secondaryPhone: z.string().optional(),
  website: z.string().url('Invalid website URL').or(z.literal('')),
  emergencyContact: z.string().optional(),
  admissionContact: z.string().optional(),
  supportContact: z.string().optional(),
});

export const ContactSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('contact', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.contact);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  const isMatch = searchQuery && (
    'Contact Information'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Manage emails, phone numbers, and official websites'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Contact Information"
        description="Manage emails, phone numbers, and official websites."
        icon={Phone}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Email *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  {...register('primaryEmail')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {errors.primaryEmail && <p className="mt-1 text-sm text-red-600">{errors.primaryEmail.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LifeBuoy className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  {...register('supportEmail')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {errors.supportEmail && <p className="mt-1 text-sm text-red-600">{errors.supportEmail.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Phone *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  {...register('primaryPhone')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {errors.primaryPhone && <p className="mt-1 text-sm text-red-600">{errors.primaryPhone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Secondary Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  {...register('secondaryPhone')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="url"
                  {...register('website')}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Emergency Contact</label>
              <input
                type="text"
                {...register('emergencyContact')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admission Contact</label>
              <input
                type="text"
                {...register('admissionContact')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Contact</label>
              <input
                type="text"
                {...register('supportContact')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
