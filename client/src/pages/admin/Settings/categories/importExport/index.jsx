import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { importExportService } from '@/services/importExportService';

import { ImportExportDashboardPanel } from './components/ImportExportDashboardPanel';
import { DataImportSection } from './components/DataImportSection';
import { DataExportSection } from './components/DataExportSection';
import { ImportHistorySection } from './components/ImportHistorySection';
import { ExportHistorySection } from './components/ExportHistorySection';
import { DataTemplatesSection } from './components/DataTemplatesSection';

export const ImportExportSettings = ({ searchQuery }) => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['importExportMetrics'],
    queryFn: importExportService.getDashboardMetrics
  });

  if (metricsLoading) {
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
        <h2 className="text-2xl font-bold text-slate-900">Import & Export Management</h2>
        <p className="text-sm text-slate-500 mt-1">
          Securely import, export, validate, and manage large-scale data across the ERP.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <DataImportSection sectionId="dataImport" searchQuery={searchQuery} />
          <DataExportSection sectionId="dataExport" searchQuery={searchQuery} />
          <DataTemplatesSection sectionId="dataTemplates" searchQuery={searchQuery} />
          <ImportHistorySection sectionId="importHistory" searchQuery={searchQuery} />
          <ExportHistorySection sectionId="exportHistory" searchQuery={searchQuery} />
        </div>

        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 sticky top-8">
          <ImportExportDashboardPanel metrics={metrics} />
        </div>
      </div>

    </div>
  );
};
