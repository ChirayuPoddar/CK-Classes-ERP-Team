import React from 'react';
import { DatabaseBackup, HardDrive, ShieldCheck, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const BackupDashboardPanel = ({ metrics, history }) => {
  if (!metrics || !history) return null;

  const storagePercentage = Math.round((metrics.usedStorage / metrics.totalStorage) * 100);
  const lastBackup = history[0]; // Assuming sorted desc

  const formatTimeAgo = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden lg:block sticky top-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          <DatabaseBackup className="h-4 w-4 mr-2 text-indigo-600" /> System Health
        </h3>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold tracking-wide uppercase">
          Protected
        </span>
      </div>
      
      <div className="p-5 space-y-6">
        
        {/* Metric 1: Next/Last Backup */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            {lastBackup?.status === 'Completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Last Backup</p>
              <p className="text-sm font-bold text-slate-900">{lastBackup?.status} ({formatTimeAgo(lastBackup?.date)})</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-slate-200/60">
            <Clock className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Next Auto Backup</p>
              <p className="text-sm font-bold text-slate-900">Today at 02:00 AM</p>
            </div>
          </div>
        </div>

        {/* Metric 2: Storage */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-500 font-medium flex items-center"><HardDrive className="h-3 w-3 mr-1" /> Storage Used</p>
              <p className="text-sm font-bold text-slate-900">{metrics.usedStorage} GB <span className="text-xs font-normal text-slate-500">of {metrics.totalStorage} GB</span></p>
            </div>
            <span className="text-xs font-bold text-slate-700">{storagePercentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${storagePercentage > 85 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-slate-100 rounded-xl">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Success Rate</p>
            <p className="text-lg font-bold text-slate-900">{metrics.backupSuccessRate}%</p>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Avg Duration</p>
            <p className="text-lg font-bold text-slate-900">{metrics.averageDuration}</p>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-center space-x-2 text-indigo-800">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold">Recovery Readiness Score</span>
          </div>
          <span className="text-lg font-black text-indigo-600">{metrics.readinessScore}</span>
        </div>

      </div>

    </div>
  );
};
