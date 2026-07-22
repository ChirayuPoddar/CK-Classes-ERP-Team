import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DownloadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { importExportService } from '@/services/importExportService';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const exportSchema = z.object({
  module: z.string().min(1, 'Please select a module'),
  format: z.enum(['CSV', 'Excel', 'JSON', 'PDF']),
  dateRange: z.enum(['All Time', 'Last 30 Days', 'This Academic Year', 'Custom Range']),
  includeHeaders: z.boolean(),
  includeMetadata: z.boolean(),
  compressExport: z.boolean()
});

const MODULES = [
  'Entire ERP', 'Students', 'Teachers', 'Attendance', 
  'Timetables', 'Analytics', 'Reports', 'Users', 'Settings', 'Roles', 'Audit Logs'
];

export const DataExportSection = ({ sectionId, searchQuery }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      module: 'Students',
      format: 'CSV',
      dateRange: 'All Time',
      includeHeaders: true,
      includeMetadata: false,
      compressExport: true
    }
  });

  const executeExport = async (data) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: '', message: '' });

    try {
      const response = await importExportService.simulateExport(data, (p) => setProgress(p));
      setStatus({ type: 'success', message: response.message });
      queryClient.invalidateQueries(['importExportHistory']);
      setTimeout(() => {
        setStatus({ type: '', message: '' });
        reset(data);
      }, 5000);
    } catch (e) {
      setStatus({ type: 'error', message: 'Export failed due to server error.' });
      setIsProcessing(false);
    }
  };

  const isMatch = searchQuery && (
    'Export'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'download'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <DownloadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Data Export Engine</h3>
            <p className="text-sm text-slate-500 mt-0.5">Generate bulk data exports across any module in multiple formats.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {status.message && (
          <div className={cn("mb-6 p-4 rounded-lg flex items-center", status.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
            {status.type === 'success' && <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(executeExport)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Source Module *</label>
                <select {...register('module')} disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.module && <p className="text-xs text-red-500 mt-1">{errors.module.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Export Format</label>
                <select {...register('format')} disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="CSV">CSV (Fastest, Raw Data)</option>
                  <option value="Excel">Excel (.xlsx) (Formatted)</option>
                  <option value="JSON">JSON (For API Integrations)</option>
                  <option value="PDF">PDF (Reports Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data Range Filter</label>
                <select {...register('dateRange')} disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="All Time">All Time (Warning: May be slow)</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Academic Year">This Academic Year</option>
                  <option value="Custom Range">Custom Date Range (Advanced)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl h-fit">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Export Options</h4>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeHeaders')} disabled={isProcessing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" />
                <span className="text-sm font-medium text-slate-700">Include Column Headers</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeMetadata')} disabled={isProcessing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" />
                <div>
                  <span className="block text-sm font-medium text-slate-700">Include System Metadata</span>
                  <span className="block text-xs text-slate-500">Adds Created At, Updated At, and DB IDs</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('compressExport')} disabled={isProcessing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50" />
                <div>
                  <span className="block text-sm font-medium text-slate-700">Compress Output (.zip)</span>
                  <span className="block text-xs text-slate-500">Recommended for exports &gt; 10,000 rows</span>
                </div>
              </label>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              {isProcessing && (
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold text-indigo-600 mb-1">
                    <span>Querying & Generating File...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Exporting...</> : 'Generate Export'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
