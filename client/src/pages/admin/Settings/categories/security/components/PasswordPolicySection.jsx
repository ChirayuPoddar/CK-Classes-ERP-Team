import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Key } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const passwordSchema = z.object({
  minLength: z.coerce.number().min(8).max(32),
  maxLength: z.coerce.number().min(8).max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiration: z.coerce.number().min(0).max(365),
  preventPasswordReuse: z.coerce.number().min(0).max(24),
  minimumAge: z.coerce.number().min(0).max(30)
}).refine(data => data.minLength <= data.maxLength, {
  message: "Minimum length cannot exceed maximum length",
  path: ["minLength"]
});

export const PasswordPolicySection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('passwordPolicy', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.passwordPolicy);
    }
  });

  const isMatch = searchQuery && (
    'Password Policy'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'password'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'length'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Password Policy"
        description="Enforce strict password complexity, expiration, and history rules for all users."
        icon={Key}
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
              <h4 className="text-sm font-semibold text-slate-900">Length Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Length</label>
                  <input type="number" {...register('minLength')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                  {errors.minLength && <p className="mt-1 text-xs text-red-600">{errors.minLength.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Maximum Length</label>
                  <input type="number" {...register('maxLength')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Complexity</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireUppercase')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require at least one uppercase letter</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireLowercase')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require at least one lowercase letter</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireNumbers')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require at least one number</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireSpecialChars')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require special character (!@#$%^&*)</span>
              </label>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password Expiration (Days)</label>
                <input type="number" {...register('passwordExpiration')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" placeholder="0 = Never" />
                <p className="mt-1 text-xs text-slate-500">0 means passwords never expire.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Prevent Reuse (History Count)</label>
                <input type="number" {...register('preventPasswordReuse')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Number of previous passwords to remember.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Age (Days)</label>
                <input type="number" {...register('minimumAge')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Prevents users from bypassing reuse rules.</p>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
