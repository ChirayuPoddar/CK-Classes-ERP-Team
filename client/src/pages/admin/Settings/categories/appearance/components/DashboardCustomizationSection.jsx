import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const dashboardSchema = z.object({
  defaultWidgets: z.array(z.string()),
  allowUserCustomization: z.boolean()
});

const AVAILABLE_WIDGETS = [
  { id: 'attendanceSummary', label: 'Attendance Summary' },
  { id: 'upcomingExams', label: 'Upcoming Exams' },
  { id: 'recentAnnouncements', label: 'Recent Announcements' },
  { id: 'feeCollection', label: 'Fee Collection Stats' },
  { id: 'quickLinks', label: 'Quick Links' },
  { id: 'staffLeave', label: 'Staff Leave Approvals' }
];

export const DashboardCustomizationSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isDirty }
  } = useForm({
    resolver: zodResolver(dashboardSchema),
    defaultValues: initialData || { defaultWidgets: [] }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => appearanceSettingsService.updateSection('dashboard', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['appearanceSettings'], data);
      setIsEditing(false);
      reset(data.dashboard);
    }
  });

  const isMatch = searchQuery && (
    'Dashboard Customization'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'dashboard'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'widget'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Dashboard Customization"
        description="Configure default widgets for users and toggle personalization rules."
        icon={Home}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="space-y-4">
            
            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <input type="checkbox" {...register('allowUserCustomization')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-semibold text-slate-900">Allow User Customization</span>
                <span className="block text-xs text-slate-500 mt-0.5">Permit individual users to drag, drop, resize, and hide widgets on their own dashboard.</span>
              </div>
            </label>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">Default Organization Widgets</label>
              <Controller
                name="defaultWidgets"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_WIDGETS.map((widget) => {
                      const isSelected = field.value?.includes(widget.id);
                      return (
                        <button
                          key={widget.id}
                          type="button"
                          onClick={() => {
                            if (!isEditing) return;
                            const newValue = isSelected
                              ? field.value.filter(id => id !== widget.id)
                              : [...(field.value || []), widget.id];
                            field.onChange(newValue);
                          }}
                          className={cn(
                            "flex items-center p-3 border rounded-lg transition-all text-left",
                            isSelected 
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" 
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            !isEditing && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <div className={cn("h-4 w-4 rounded border flex items-center justify-center mr-3", isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300")}>
                            {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm font-medium">{widget.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
