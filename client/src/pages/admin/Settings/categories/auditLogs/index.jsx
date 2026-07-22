import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsService } from '@/services/auditLogsService';

import { AuditDashboardPanel } from './components/AuditDashboardPanel';
import { ActivityLogSection } from './components/ActivityLogSection';
import { LogRetentionSection } from './components/LogRetentionSection';
import { AuditNotificationsSection } from './components/AuditNotificationsSection';
import { LogExportSection } from './components/LogExportSection';

export const AuditLogsSettings = ({ searchQuery }) => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['auditMetrics'],
    queryFn: auditLogsService.getDashboardMetrics
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['auditSettings'],
    queryFn: auditLogsService.getSettings
  });

  const isLoading = metricsLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/4 mb-8"></div>
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-96 bg-slate-100 rounded-xl w-full" />
            <div className="h-64 bg-slate-100 rounded-xl w-full" />
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
        <h2 className="text-2xl font-bold text-slate-900">Audit Logs & Activity Monitoring</h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor system activity, investigate security events, and manage log retention policies.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <ActivityLogSection sectionId="activityLog" searchQuery={searchQuery} />
          <LogRetentionSection initialData={settings?.retention} sectionId="logRetention" searchQuery={searchQuery} />
          <AuditNotificationsSection initialData={settings?.notifications} sectionId="auditNotifications" searchQuery={searchQuery} />
          <LogExportSection sectionId="logExport" searchQuery={searchQuery} />
        </div>

        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 sticky top-8">
          <AuditDashboardPanel metrics={metrics} />
        </div>
      </div>

    </div>
  );
};
