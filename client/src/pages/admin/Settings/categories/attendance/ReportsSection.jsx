import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const reportsSchema = z.object({
  defaultReportFormat: z.enum(['PDF', 'Excel', 'CSV']),
  includePhotos: z.boolean(),
  includeSignatures: z.boolean(),
  includeRemarks: z.boolean(),
  defaultDateRange: z.enum(['Today', 'This Week', 'This Month', 'This Term']),
  reportBranding: z.boolean()
});

export const ReportsSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(reportsSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('reports', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.reports);
    }
  });

  const isMatch = searchQuery && (
    'Reports & Exports'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'report'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Reports & Exports"
        description="Configure default formats and fields for downloaded attendance reports."
        icon={FileText}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Export Format *</label>
              <select {...register('defaultReportFormat')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                <option value="CSV">Comma Separated Values (.csv)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Date Range Filter *</label>
              <select {...register('defaultDateRange')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Term">This Term</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includePhotos')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Photos</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeSignatures')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Signatures</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeRemarks')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Remarks</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('reportBranding')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Apply School Branding</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
