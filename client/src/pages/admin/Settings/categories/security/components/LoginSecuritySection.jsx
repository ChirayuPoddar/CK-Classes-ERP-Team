import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const loginSchema = z.object({
  maxFailedAttempts: z.coerce.number().min(3).max(20),
  accountLockDuration: z.coerce.number().min(1).max(1440),
  permanentLockThreshold: z.coerce.number().min(5).max(50),
  captchaAfterFailedAttempts: z.coerce.number().min(0).max(10),
  loginCooldown: z.coerce.number().min(0).max(60),
  requireEmailVerification: z.boolean(),
  requirePhoneVerification: z.boolean(),
  loginAlerts: z.boolean()
});

export const LoginSecuritySection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('loginSecurity', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.loginSecurity);
    }
  });

  const isMatch = searchQuery && (
    'Login Security'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'login'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'lockout'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Login Security & Lockouts"
        description="Prevent brute-force attacks and configure login cooldowns."
        icon={LogIn}
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
              <h4 className="text-sm font-semibold text-slate-900">Lockout Rules</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Failed Login Attempts</label>
                <input type="number" {...register('maxFailedAttempts')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Lock Duration (Minutes)</label>
                <input type="number" {...register('accountLockDuration')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Permanent Lock Threshold</label>
                <input type="number" {...register('permanentLockThreshold')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Requires manual unlock by an Administrator.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Bot Protection</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Require Captcha After (Attempts)</label>
                <input type="number" {...register('captchaAfterFailedAttempts')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">0 means always require Captcha.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Login Cooldown (Seconds)</label>
                <input type="number" {...register('loginCooldown')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-xs text-slate-500">Delay between login attempts to mitigate brute-force.</p>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requireEmailVerification')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require Email Verification on First Login</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('requirePhoneVerification')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require Phone Verification on First Login</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('loginAlerts')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Send New Device Login Alerts to Users</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
