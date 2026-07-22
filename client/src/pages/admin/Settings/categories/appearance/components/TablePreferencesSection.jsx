import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LayoutGrid } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const tableSchema = z.object({
  defaultRowsPerPage: z.coerce.number().min(5).max(100),
  compactTables: z.boolean(),
  alternateRowColors: z.boolean(),
  stickyHeaders: z.boolean(),
  columnDensity: z.enum(['Compact', 'Comfortable']),
  rememberColumnVisibility: z.boolean()
});

export const TablePreferencesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(tableSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('table', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.table);
    }
  });

  const isMatch = searchQuery && (
    'Table Preferences'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'table'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'row'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Table Preferences"
        description="Set default data grid behaviors, pagination, and styling."
        icon={LayoutGrid}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Pagination & Density</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Rows Per Page</label>
                <select {...register('defaultRowsPerPage')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="10">10 Rows</option>
                  <option value="25">25 Rows</option>
                  <option value="50">50 Rows</option>
                  <option value="100">100 Rows</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Column Density</label>
                <select {...register('columnDensity')} disabled={!isEditing} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white disabled:opacity-70">
                  <option value="Compact">Compact (Less padding)</option>
                  <option value="Comfortable">Comfortable (Standard padding)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Styling & Behavior</h4>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('compactTables')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Force Compact Tables Globally</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('alternateRowColors')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Zebra Striping (Alternate Row Colors)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('stickyHeaders')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Sticky Table Headers</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('rememberColumnVisibility')} disabled={!isEditing} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Remember user's column visibility preferences</span>
              </label>
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
