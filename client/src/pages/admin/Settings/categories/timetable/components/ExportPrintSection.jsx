import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const exportPrintSchema = z.object({
  defaultFormat: z.enum(['PDF', 'Excel', 'CSV']),
  printLayout: z.enum(['Landscape', 'Portrait']),
  includeTeacherNames: z.boolean(),
  includeRoomNumbers: z.boolean(),
  includeBranding: z.boolean()
});

export const ExportPrintSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(exportPrintSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => timetableSettingsService.updateSection('exportPrint', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['timetableSettings'], data);
      setIsEditing(false);
      reset(data.exportPrint);
    }
  });

  const isMatch = searchQuery && (
    'Export & Print'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'print'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Export & Print Settings"
        description="Configure default layouts and formats for downloaded schedules."
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Export Format</label>
              <select {...register('defaultFormat')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="PDF">PDF Document</option>
                <option value="Excel">Excel Spreadsheet</option>
                <option value="CSV">CSV Format</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default Print Layout</label>
              <select {...register('printLayout')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Landscape">Landscape</option>
                <option value="Portrait">Portrait</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeTeacherNames')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Teacher Names on Print/Export</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeRoomNumbers')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Include Room Numbers on Print/Export</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('includeBranding')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Apply School Branding (Logos & Colors)</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
