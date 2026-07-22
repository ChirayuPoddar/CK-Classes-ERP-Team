import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { backupSettingsService } from '@/services/backupSettingsService';

import { BackupDashboardPanel } from './components/BackupDashboardPanel';
import { AutomaticBackupsSection } from './components/AutomaticBackupsSection';
import { ManualBackupSection } from './components/ManualBackupSection';
import { RestoreSection } from './components/RestoreSection';
import { BackupHistorySection } from './components/BackupHistorySection';
import { StorageManagementSection } from './components/StorageManagementSection';
import { BackupVerificationSection } from './components/BackupVerificationSection';
import { DisasterRecoverySection } from './components/DisasterRecoverySection';
import { ExportImportSection } from './components/ExportImportSection';
import { BackupNotificationsSection } from './components/BackupNotificationsSection';

export const BackupSettings = ({ searchQuery }) => {
  const { data: initialData, isLoading: settingsLoading } = useQuery({
    queryKey: ['backupSettings'],
    queryFn: backupSettingsService.getSettings
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['backupMetrics'],
    queryFn: backupSettingsService.getDashboardMetrics
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['backupHistory'],
    queryFn: backupSettingsService.getHistory
  });

  const isLoading = settingsLoading || metricsLoading || historyLoading;

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
        <h2 className="text-2xl font-bold text-slate-900">Backup & Disaster Recovery</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure automated backups, perform manual data snapshots, and manage system restoration.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <AutomaticBackupsSection initialData={initialData?.automaticBackups} sectionId="automaticBackups" searchQuery={searchQuery} />
          <ManualBackupSection sectionId="manualBackup" searchQuery={searchQuery} />
          <RestoreSection sectionId="restore" searchQuery={searchQuery} />
          <BackupHistorySection sectionId="backupHistory" searchQuery={searchQuery} />
          <StorageManagementSection sectionId="storageManagement" searchQuery={searchQuery} />
          <BackupVerificationSection initialData={initialData?.backupVerification} sectionId="backupVerification" searchQuery={searchQuery} />
          <DisasterRecoverySection initialData={initialData?.disasterRecovery} sectionId="disasterRecovery" searchQuery={searchQuery} />
          <ExportImportSection sectionId="exportImport" searchQuery={searchQuery} />
          <BackupNotificationsSection initialData={initialData?.backupNotifications} sectionId="backupNotifications" searchQuery={searchQuery} />
        </div>

        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 sticky top-8">
          <BackupDashboardPanel metrics={metrics} history={history} />
        </div>
      </div>

    </div>
  );
};
