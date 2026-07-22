import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DownloadCloud, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { backupSettingsService } from '@/services/backupSettingsService';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const manualSchema = z.object({
  backupName: z.string().min(3).max(50),
  description: z.string().max(200).optional(),
  modules: z.array(z.string()).min(1, "Select at least one module")
});

const MODULES = [
  'Entire ERP', 'Attendance', 'Timetable', 'Students', 
  'Teachers', 'Analytics', 'Settings', 'Notifications', 'Users', 'Security'
];

export const ManualBackupSection = ({ sectionId, searchQuery }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      backupName: `Manual_Backup_${new Date().toISOString().split('T')[0]}`,
      description: '',
      modules: ['Entire ERP']
    }
  });

  const selectedModules = watch('modules') || [];
  const isEntireERP = selectedModules.includes('Entire ERP');

  const onSubmit = async (data) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: '', message: '' });

    try {
      const response = await backupSettingsService.performManualBackup(data, (p) => setProgress(p));
      setStatus({ type: 'success', message: response.message });
      queryClient.invalidateQueries(['backupHistory']);
      queryClient.invalidateQueries(['backupMetrics']);
      reset({ ...data, backupName: `Manual_Backup_${new Date().toISOString().split('T')[0]}_${Math.floor(Math.random()*1000)}` });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (e) {
      setStatus({ type: 'error', message: 'Backup failed to initiate.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isMatch = searchQuery && (
    'Manual Backup'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'manual'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'create backup'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <DownloadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manual Backup Snapshot</h3>
            <p className="text-sm text-slate-500 mt-0.5">Trigger an immediate backup of selected modules before major system changes.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {status.message && (
          <div className={cn("mb-6 p-4 rounded-lg flex items-center", status.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
            {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" /> : null}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Backup Name *</label>
                <input type="text" {...register('backupName')} disabled={isProcessing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70" />
                {errors.backupName && <p className="mt-1 text-xs text-red-600">{errors.backupName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea {...register('description')} disabled={isProcessing} rows="3" placeholder="e.g., Pre-upgrade snapshot v1.12" className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70"></textarea>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Modules to Backup *</label>
              {errors.modules && <p className="mb-2 text-xs text-red-600">{errors.modules.message}</p>}
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-[190px] overflow-y-auto">
                <Controller
                  name="modules"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {MODULES.map(mod => {
                        const isChecked = field.value.includes(mod);
                        const isDisabled = isProcessing || (isEntireERP && mod !== 'Entire ERP');
                        return (
                          <label key={mod} className={cn("flex items-center space-x-3 cursor-pointer", isDisabled && !isChecked && "opacity-40")}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (isDisabled) return;
                                if (mod === 'Entire ERP') {
                                  field.onChange(e.target.checked ? ['Entire ERP'] : []);
                                } else {
                                  const newVal = e.target.checked 
                                    ? [...field.value, mod] 
                                    : field.value.filter(m => m !== mod);
                                  field.onChange(newVal);
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                            />
                            <span className="text-sm font-medium text-slate-700">{mod}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              {isProcessing && (
                <div className="w-full">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Processing Snapshot...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Backing up...</>
              ) : (
                <><Play className="-ml-1 mr-2 h-4 w-4" /> Start Manual Backup</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
