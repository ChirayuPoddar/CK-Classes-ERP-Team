import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HardDrive, Server, Trash2 } from 'lucide-react';
import { backupSettingsService } from '@/services/backupSettingsService';

export const StorageManagementSection = ({ sectionId, searchQuery }) => {
  const { data: metrics } = useQuery({
    queryKey: ['backupMetrics'],
    queryFn: backupSettingsService.getDashboardMetrics
  });

  const isMatch = searchQuery && (
    'Storage Management'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'storage'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'clean'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!metrics) return null;

  const storagePercentage = Math.round((metrics.usedStorage / metrics.totalStorage) * 100);

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Storage Management</h3>
            <p className="text-sm text-slate-500 mt-0.5">Monitor capacity and manage lifecycle of backup archives.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm text-slate-900 font-bold mb-1">Total Allocated Storage</p>
              <p className="text-xs text-slate-500 font-medium">{metrics.usedStorage} GB used of {metrics.totalStorage} GB limit</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${storagePercentage > 85 ? 'text-red-600' : storagePercentage > 70 ? 'text-amber-600' : 'text-indigo-600'}`}>
                {storagePercentage}%
              </span>
            </div>
          </div>
          
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all ${storagePercentage > 85 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-3 text-[10px] uppercase font-bold text-slate-500">
            <span>0 GB</span>
            <span>{metrics.totalStorage / 2} GB</span>
            <span>{metrics.totalStorage} GB</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Growth Trend</h4>
            <p className="text-sm font-bold text-slate-900 flex items-center">
              <span className="text-red-500 mr-2">↑</span> +12.4 GB / month
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg Backup Size</h4>
            <p className="text-sm font-bold text-slate-900">
              2.45 GB
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Storage Provider</h4>
            <p className="text-sm font-bold text-slate-900 flex items-center">
              <Server className="h-4 w-4 text-slate-400 mr-1.5" /> AWS S3 (us-east-1)
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm flex items-center">
            <Trash2 className="h-4 w-4 mr-2 text-slate-400" />
            Cleanup Expired Backups
          </button>
          <button className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 shadow-sm">
            Request Storage Upgrade
          </button>
        </div>

      </div>
    </div>
  );
};
