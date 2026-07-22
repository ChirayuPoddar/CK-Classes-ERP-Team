import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { backupSettingsService } from '@/services/backupSettingsService';
import { cn } from '@/utils/cn';

export const ExportImportSection = ({ sectionId, searchQuery }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.enc') && !file.name.endsWith('.zip') && !file.name.endsWith('.sql')) {
      setStatus({ type: 'error', message: 'Invalid file type. Please upload a .enc, .zip, or .sql backup archive.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const res = await backupSettingsService.simulateImport();
      setStatus({ type: 'success', message: res.message });
      e.target.value = null;
    } catch (err) {
      setStatus({ type: 'error', message: 'Import failed. File may be corrupted.' });
    } finally {
      setIsUploading(false);
    }
  };

  const isMatch = searchQuery && (
    'Export'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Import'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'upload'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">External Import & Migration</h3>
            <p className="text-sm text-slate-500 mt-0.5">Upload a backup archive from external storage to restore it.</p>
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

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
          
          <input 
            type="file" 
            accept=".zip,.sql,.enc"
            onChange={handleImport}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Validating and Importing Archive...</p>
                <p className="text-xs text-slate-500">Please do not close this window.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="p-3 bg-white rounded-full shadow-sm mb-2">
                <UploadCloud className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Click to browse or drag and drop</p>
              <p className="text-xs text-slate-500">Supports .ZIP, .SQL, or .ENC backup archives up to 10GB.</p>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
};
