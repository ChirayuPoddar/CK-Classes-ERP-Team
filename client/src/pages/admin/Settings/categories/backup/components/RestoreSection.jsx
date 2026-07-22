import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { backupSettingsService } from '@/services/backupSettingsService';
import { cn } from '@/utils/cn';

export const RestoreSection = ({ sectionId, searchQuery }) => {
  const [selectedBackup, setSelectedBackup] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const queryClient = useQueryClient();
  const { data: history } = useQuery({
    queryKey: ['backupHistory'],
    queryFn: backupSettingsService.getHistory
  });

  const availableBackups = history?.filter(b => b.status === 'Completed') || [];
  const selectedBackupData = availableBackups.find(b => b.id === selectedBackup);

  const handleRestore = async () => {
    if (!selectedBackupData) return;
    if (!window.confirm(`CRITICAL WARNING:\n\nYou are about to restore the system from backup '${selectedBackupData.name}'.\nAll current data will be overwritten.\n\nAre you absolutely sure you want to proceed?`)) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: '', message: '' });

    try {
      const response = await backupSettingsService.performRestore(selectedBackupData.id, selectedBackupData.modules, (p) => setProgress(p));
      setStatus({ type: 'success', message: response.message });
      setTimeout(() => {
        setStatus({ type: '', message: '' });
        setSelectedBackup('');
      }, 6000);
    } catch (e) {
      setStatus({ type: 'error', message: 'Restore failed. Please check the logs.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  const isMatch = searchQuery && (
    'Restore'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'rollback'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden ${isMatch ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-900">System Restore (Rollback)</h3>
            <p className="text-sm text-orange-700 mt-0.5">Restore the ERP to a previous state. This action is destructive to current data.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {status.message && (
          <div className={cn("mb-6 p-4 rounded-lg flex items-center", status.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
            {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" /> : <AlertTriangle className="h-5 w-5 mr-3 text-red-600" />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Target Backup *</label>
            <select 
              value={selectedBackup}
              onChange={(e) => setSelectedBackup(e.target.value)}
              disabled={isProcessing}
              className="block w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-orange-500 sm:text-sm bg-white disabled:opacity-70"
            >
              <option value="">-- Choose a backup --</option>
              {availableBackups.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({formatDate(b.date)})
                </option>
              ))}
            </select>
          </div>

          {selectedBackupData && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Backup Contents Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Creator</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedBackupData.createdBy}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Size</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedBackupData.size}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Version</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedBackupData.version}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Type</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedBackupData.type}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Modules Included</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBackupData.modules.map(m => (
                    <span key={m} className="px-2 py-1 bg-white border border-slate-200 text-xs text-slate-700 rounded-md shadow-sm">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              {isProcessing && (
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold text-orange-600 mb-1">
                    <span>Restoring System Data... Do not close window.</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleRestore}
              disabled={isProcessing || !selectedBackupData}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Processing...</>
              ) : (
                <><RotateCcw className="-ml-1 mr-2 h-4 w-4" /> Restore {selectedBackupData?.modules.includes('Entire ERP') ? 'Entire System' : 'Selected Modules'}</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
