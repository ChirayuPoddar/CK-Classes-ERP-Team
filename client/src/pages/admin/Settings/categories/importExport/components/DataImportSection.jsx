import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, FileSpreadsheet, Map, ShieldAlert, CheckCircle2, Play, Loader2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { importExportService } from '@/services/importExportService';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const importSchema = z.object({
  module: z.string().min(1, 'Please select a module'),
  fileType: z.string(),
  fileName: z.string().optional()
});

const MODULES = [
  'Students', 'Teachers', 'Classes', 'Subjects', 'Departments', 
  'Attendance', 'Timetables', 'Rooms', 'Users', 'Roles'
];

export const DataImportSection = ({ sectionId, searchQuery }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(importSchema),
    defaultValues: { module: 'Students', fileType: 'CSV' }
  });

  const selectedModule = watch('module');

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setValue('fileName', droppedFile.name);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setValue('fileName', '');
    setProgress(0);
    setStatus({ type: '', message: '' });
  };

  const executeImport = async (data) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: '', message: '' });

    try {
      const response = await importExportService.simulateImport(data, (p) => setProgress(p));
      setStatus({ type: 'success', message: response.message });
      queryClient.invalidateQueries(['importExportHistory']);
      queryClient.invalidateQueries(['importExportMetrics']);
      setTimeout(() => {
        resetWizard();
      }, 3000);
    } catch (e) {
      setStatus({ type: 'error', message: 'Import failed due to server error.' });
      setIsProcessing(false);
    }
  };

  const isMatch = searchQuery && (
    'Import'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'upload'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'csv'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Data Import Wizard</h3>
            <p className="text-sm text-slate-500 mt-0.5">Securely upload and validate bulk records into the ERP.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {/* Wizard Progress Bar */}
        <div className="mb-8 hidden sm:block">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
            
            {[
              { num: 1, label: 'Upload', icon: UploadCloud },
              { num: 2, label: 'Preview', icon: FileSpreadsheet },
              { num: 3, label: 'Mapping', icon: Map },
              { num: 4, label: 'Validate', icon: ShieldAlert },
              { num: 5, label: 'Review', icon: AlertCircle },
              { num: 6, label: 'Import', icon: Play }
            ].map(s => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors", 
                  step >= s.num ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-400"
                )}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.num}
                </div>
                <span className={cn("mt-2 text-[10px] font-bold uppercase tracking-wider absolute top-8 whitespace-nowrap", step >= s.num ? "text-indigo-900" : "text-slate-400")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(executeImport)}>
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Module *</label>
                  <select {...register('module')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Expected File Format</label>
                  <select {...register('fileType')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                    <option value="CSV">CSV (Recommended)</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="JSON">JSON Array</option>
                  </select>
                </div>
              </div>

              <div 
                className={cn("border-2 border-dashed rounded-xl p-10 text-center transition-colors relative", file ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input type="file" accept=".csv,.xlsx,.json" onChange={handleFileDrop} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {file ? (
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <p className="text-sm font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center z-20 pointer-events-auto">
                      <X className="h-3 w-3 mr-1" /> Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-2">
                      <UploadCloud className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Drag and drop your file here</p>
                    <p className="text-xs text-slate-500">Or click to browse from your computer</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-4">Supports CSV, XLSX, JSON up to 50MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Data Preview (First 3 Rows)</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Last Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm text-slate-700">
                    <tr><td className="px-4 py-2">STU_001</td><td className="px-4 py-2">John</td><td className="px-4 py-2">Doe</td><td className="px-4 py-2">john@example.com</td></tr>
                    <tr><td className="px-4 py-2">STU_002</td><td className="px-4 py-2">Jane</td><td className="px-4 py-2">Smith</td><td className="px-4 py-2">jane@example.com</td></tr>
                    <tr><td className="px-4 py-2">STU_003</td><td className="px-4 py-2">Alex</td><td className="px-4 py-2">Johnson</td><td className="px-4 py-2">alex@example.com</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">Total Rows Detected: 450</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Column Mapping</h4>
              <p className="text-xs text-slate-500 mb-4">Map your file headers to the required {selectedModule} fields.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['ID', 'First Name', 'Last Name', 'Email'].map(field => (
                  <div key={field} className="flex items-center space-x-3">
                    <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200 text-sm font-medium text-slate-700">{field}</div>
                    <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 bg-white">
                      <option>{field} (Auto-mapped)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <h4 className="text-sm font-bold text-slate-900">Validating Records...</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Checking for duplicates, validating emails, and verifying foreign keys against the database.</p>
              {/* Simulate auto-advance after 2 seconds in real life, but we use manual button for this mock */}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Validation Complete with Warnings</h4>
                  <p className="text-xs text-amber-700 mt-1">450 rows parsed. 448 valid. 2 rows contain errors and will be skipped.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Row</th><th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Error Description</th></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-700">
                    <tr><td className="px-4 py-2 font-medium">Row 45</td><td className="px-4 py-2 text-red-600">Duplicate Email: john@example.com</td></tr>
                    <tr><td className="px-4 py-2 font-medium">Row 112</td><td className="px-4 py-2 text-red-600">Missing Required Field: Last Name</td></tr>
                  </tbody>
                </table>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer pt-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Acknowledge errors and skip invalid rows during import</span>
              </label>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-6 text-center">
              
              {status.type === 'success' ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h4 className="text-lg font-bold text-slate-900">Import Successful</h4>
                  <p className="text-sm text-slate-500 mt-2">{status.message}</p>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <Play className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Ready to Import</h4>
                  <p className="text-sm text-slate-500 mb-6">You are about to insert 448 records into the {selectedModule} module. This action cannot be easily undone.</p>
                  
                  {isProcessing && (
                    <div className="w-full mt-4">
                      <div className="flex justify-between text-xs font-semibold text-indigo-600 mb-1">
                        <span>Writing to database...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={step === 1 || isProcessing || status.type === 'success'}
              className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Back
            </button>
            
            {step < 6 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                disabled={step === 1 && !file}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                Next Step
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isProcessing || status.type === 'success'}
                className="flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Processing...</> : 'Confirm & Import'}
              </button>
            )}
          </div>
          
        </form>
      </div>
    </div>
  );
};
