import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const riskSchema = z.object({
  minimumAttendancePercentage: z.coerce.number().min(1).max(100),
  riskLevelGreen: z.coerce.number().min(1).max(100),
  riskLevelYellow: z.coerce.number().min(1).max(100),
  riskLevelOrange: z.coerce.number().min(1).max(100),
  riskLevelRed: z.coerce.number().min(1).max(100),
  automaticRiskDetection: z.boolean(),
  consecutiveAbsenceAlert: z.boolean(),
  attendanceTrendMonitoring: z.boolean(),
  enableRiskDashboard: z.boolean()
});

export const RiskDetectionSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(riskSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('riskDetection', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.riskDetection);
    }
  });

  const isMatch = searchQuery && (
    'Risk Detection'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'risk'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Risk Detection & Analytics"
        description="Configure automated early warning systems for chronic absenteeism."
        icon={AlertTriangle}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mandatory Minimum Attendance (%) *</label>
              <input
                type="number"
                {...register('minimumAttendancePercentage')}
                className="block w-full md:w-1/2 lg:w-1/4 px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm"
              />
              {errors.minimumAttendancePercentage && <p className="mt-1 text-sm text-red-600">{errors.minimumAttendancePercentage.message}</p>}
            </div>

            <div className="md:col-span-2 lg:col-span-4 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Risk Level Thresholds (%)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Green (Safe)</label>
                  <div className="flex items-center">
                    <span className="text-sm text-emerald-700 mr-2">&ge;</span>
                    <input type="number" {...register('riskLevelGreen')} className="block w-full px-2 py-1 text-sm border-emerald-300 rounded focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Yellow (Monitor)</label>
                  <div className="flex items-center">
                    <span className="text-sm text-yellow-700 mr-2">&lt;</span>
                    <input type="number" {...register('riskLevelYellow')} className="block w-full px-2 py-1 text-sm border-yellow-300 rounded focus:ring-yellow-500" />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">Orange (At Risk)</label>
                  <div className="flex items-center">
                    <span className="text-sm text-orange-700 mr-2">&lt;</span>
                    <input type="number" {...register('riskLevelOrange')} className="block w-full px-2 py-1 text-sm border-orange-300 rounded focus:ring-orange-500" />
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <label className="block text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Red (Critical)</label>
                  <div className="flex items-center">
                    <span className="text-sm text-red-700 mr-2">&lt;</span>
                    <input type="number" {...register('riskLevelRed')} className="block w-full px-2 py-1 text-sm border-red-300 rounded focus:ring-red-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('automaticRiskDetection')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Automatic Risk Detection</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('consecutiveAbsenceAlert')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Flag Consecutive Absences Immediately</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('attendanceTrendMonitoring')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Monitor Negative Attendance Trends</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" {...register('enableRiskDashboard')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Enable Early Warning Dashboard for Teachers</span>
              </label>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
