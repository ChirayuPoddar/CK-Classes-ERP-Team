import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Smartphone } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const twoFactorSchema = z.object({
  enable2FA: z.boolean(),
  enforce2FA: z.boolean(),
  authenticatorApp: z.boolean(),
  emailOTP: z.boolean(),
  smsOTP: z.boolean(),
  backupCodes: z.boolean(),
  trustedDevices: z.coerce.number().min(0).max(365)
});

export const TwoFactorAuthSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: initialData || {}
  });

  const isEnabled = watch('enable2FA');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('twoFactorAuth', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.twoFactorAuth);
    }
  });

  const isMatch = searchQuery && (
    'Two-Factor Authentication'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    '2fa'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'mfa'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Two-Factor Authentication (2FA)"
        description="Add an extra layer of security requiring multiple forms of verification."
        icon={Smartphone}
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
                <input type="checkbox" {...register('enable2FA')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">Enable 2FA Organization-Wide</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Allows users to opt-in to Two-Factor Authentication.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-red-50 border border-red-200 rounded-lg opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
                <input type="checkbox" {...register('enforce2FA')} disabled={!isEditing || !isEnabled} className="h-5 w-5 rounded border-red-300 text-red-600 focus:ring-red-500" />
                <div>
                  <span className="block text-sm font-semibold text-red-900">Enforce 2FA for all users</span>
                  <span className="block text-xs text-red-700 mt-0.5">Requires every user to setup 2FA upon their next login. This is a strict security posture.</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Allowed 2FA Methods</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('authenticatorApp')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Authenticator App (TOTP - Recommended)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('emailOTP')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Email OTP</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('smsOTP')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">SMS OTP (Requires SMS Gateway Integration)</span>
              </label>
            </div>

            <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: isEnabled ? 1 : 0.5, pointerEvents: isEnabled ? 'auto' : 'none' }}>
              <h4 className="text-sm font-semibold text-slate-900">Device Trust</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Trusted Device Lifespan (Days)</label>
                <input type="number" {...register('trustedDevices')} disabled={!isEditing || !isEnabled} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Days to "Remember this device" before challenging again. 0 disables this feature.</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer mt-4">
                <input type="checkbox" {...register('backupCodes')} disabled={!isEditing || !isEnabled} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Allow users to generate offline Backup Codes</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
