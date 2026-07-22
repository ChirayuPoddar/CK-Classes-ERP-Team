import React, { useState } from 'react';
import { DownloadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { auditLogsService } from '@/services/auditLogsService';
import { cn } from '@/utils/cn';

export const LogExportSection = ({ sectionId, searchQuery }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });

  const executeExport = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: '', message: '' });

    try {
      const response = await auditLogsService.simulateExport({}, (p) => setProgress(p));
      setStatus({ type: 'success', message: response.message });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to generate export file.' });
    } finally {
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
            <h3 className="text-lg font-bold text-slate-900">Export Audit Trail</h3>
            <p className="text-sm text-slate-500 mt-0.5">Download system activity logs for compliance and external auditing.</p>
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

        <form onSubmit={executeExport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date Range Filter</label>
                <select disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Academic Year</option>
                  <option>All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Output Format</label>
                <select disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option>CSV (Recommended for Excel/Splunk)</option>
                  <option>JSON (For API Integrations)</option>
                  <option>PDF (Compliance Report Format)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Filter Scope</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" disabled={isProcessing} defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include system background processes</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" disabled={isProcessing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Only export Critical/Error severities</span>
              </label>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              {isProcessing && (
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold text-indigo-600 mb-1">
                    <span>Compiling Audit Logs...</span>
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
              {isProcessing ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Generating...</> : 'Generate Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
