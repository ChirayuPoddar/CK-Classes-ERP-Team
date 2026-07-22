import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { securitySettingsService } from '@/services/securitySettingsService';

import { SecurityDashboardPanel } from './components/SecurityDashboardPanel';
import { PasswordPolicySection } from './components/PasswordPolicySection';
import { SessionManagementSection } from './components/SessionManagementSection';
import { LoginSecuritySection } from './components/LoginSecuritySection';
import { TwoFactorAuthSection } from './components/TwoFactorAuthSection';
import { DeviceManagementSection } from './components/DeviceManagementSection';
import { AccessRestrictionsSection } from './components/AccessRestrictionsSection';
import { AuditLoggingSection } from './components/AuditLoggingSection';
import { SecurityAlertsSection } from './components/SecurityAlertsSection';
import { DataProtectionSection } from './components/DataProtectionSection';
import { EmergencyControlsSection } from './components/EmergencyControlsSection';

export const SecuritySettings = ({ searchQuery }) => {
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['securitySettings'],
    queryFn: securitySettingsService.getSettings
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/4 mb-8"></div>
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl w-full" />)}
          </div>
          <div className="w-1/3 hidden lg:block">
            <div className="h-96 bg-slate-100 rounded-xl w-full sticky top-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Security & Identity</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure organization-wide authentication policies, session controls, and access restrictions.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <PasswordPolicySection initialData={initialData?.passwordPolicy} sectionId="passwordPolicy" searchQuery={searchQuery} />
          <SessionManagementSection initialData={initialData?.sessionManagement} sectionId="sessionManagement" searchQuery={searchQuery} />
          <LoginSecuritySection initialData={initialData?.loginSecurity} sectionId="loginSecurity" searchQuery={searchQuery} />
          <TwoFactorAuthSection initialData={initialData?.twoFactorAuth} sectionId="twoFactorAuth" searchQuery={searchQuery} />
          <DeviceManagementSection sectionId="deviceManagement" searchQuery={searchQuery} />
          <AccessRestrictionsSection initialData={initialData?.accessRestrictions} sectionId="accessRestrictions" searchQuery={searchQuery} />
          <AuditLoggingSection initialData={initialData?.auditLogging} sectionId="auditLogging" searchQuery={searchQuery} />
          <SecurityAlertsSection initialData={initialData?.securityAlerts} sectionId="securityAlerts" searchQuery={searchQuery} />
          <DataProtectionSection initialData={initialData?.dataProtection} sectionId="dataProtection" searchQuery={searchQuery} />
          <EmergencyControlsSection sectionId="emergencyControls" searchQuery={searchQuery} />
        </div>

        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 sticky top-8">
          <SecurityDashboardPanel settings={initialData} />
        </div>
      </div>

    </div>
  );
};
