import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Network } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { securitySettingsService } from '@/services/securitySettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const accessSchema = z.object({
  allowedIPs: z.string(),
  blockedIPs: z.string(),
  countryRestrictions: z.string(),
  officeNetworkOnly: z.boolean(),
  vpnRequirement: z.boolean(),
  schoolNetworkRequirement: z.boolean(),
  weekendLoginRules: z.enum(['Allow', 'Warn', 'Block'])
});

export const AccessRestrictionsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(accessSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => securitySettingsService.updateSection('accessRestrictions', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['securitySettings'], data);
      setIsEditing(false);
      reset(data.accessRestrictions);
    }
  });

  const isMatch = searchQuery && (
    'Access Restrictions'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'ip'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'network'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Network & Access Restrictions"
        description="Restrict ERP access by IP Address, Geolocation, or active VPNs."
        icon={Network}
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
              <h4 className="text-sm font-semibold text-slate-900">IP Whitelisting & Blacklisting</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Allowed IP Addresses (CIDR supported)</label>
                <textarea {...register('allowedIPs')} disabled={!isEditing} rows="2" placeholder="e.g., 192.168.1.0/24, 10.0.0.1" className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70"></textarea>
                <p className="mt-1 text-[10px] text-slate-500">Leave blank to allow all. Comma separated.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Blocked IP Addresses</label>
                <textarea {...register('blockedIPs')} disabled={!isEditing} rows="2" placeholder="e.g., 203.0.113.0/24" className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Country Restrictions (ISO Codes)</label>
                <input type="text" {...register('countryRestrictions')} disabled={!isEditing} placeholder="e.g., RU, KP, IR" className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                <p className="mt-1 text-[10px] text-slate-500">Comma separated. Block logins originating from these countries.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Network & Temporal Policies</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('officeNetworkOnly')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enforce Office Network Only (Restricts to internal IPs)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('schoolNetworkRequirement')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enforce School WiFi/Intranet Requirement</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('vpnRequirement')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Require active VPN connection for Admin Roles</span>
              </label>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Weekend Login Policy (For Staff/Students)</label>
                <select {...register('weekendLoginRules')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Allow">Allow Free Access</option>
                  <option value="Warn">Warn Users & Log Event</option>
                  <option value="Block">Block Access Completely</option>
                </select>
              </div>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
