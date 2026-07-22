import React from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle, Database, AlertCircle, RefreshCw } from 'lucide-react';

export const ImportExportDashboardPanel = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden lg:block sticky top-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          <ArrowLeftRight className="h-4 w-4 mr-2 text-indigo-600" /> Data Exchange Hub
        </h3>
        {metrics.pendingImports > 0 ? (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold tracking-wide uppercase flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Processing
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold tracking-wide uppercase">
            Idle
          </span>
        )}
      </div>
      
      <div className="p-5 space-y-6">
        
        {/* Metric 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Records Imported</p>
              <p className="text-sm font-bold text-slate-900">{metrics.importedRecords.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Successful Imports</p>
              <p className="text-sm font-bold text-slate-900">{metrics.successfulImports} / {metrics.recentImports}</p>
            </div>
          </div>
          <span className="text-xs text-green-600 font-bold">{metrics.successRate}%</span>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Failed Imports</p>
              <p className="text-sm font-bold text-slate-900">{metrics.failedImports}</p>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Validation Errors (30d)</p>
              <p className="text-sm font-bold text-slate-900">{metrics.validationErrors}</p>
            </div>
          </div>
          <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-700">Review</button>
        </div>

      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">System Load</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
            <span>Import Queue</span>
            <span>{metrics.pendingImports} Pending</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full ${metrics.pendingImports > 0 ? 'bg-amber-500 w-1/3' : 'bg-green-500 w-full'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
