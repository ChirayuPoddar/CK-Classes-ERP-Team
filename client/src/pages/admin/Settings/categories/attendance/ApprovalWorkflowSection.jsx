import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckSquare } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const approvalSchema = z.object({
  requireAttendanceApproval: z.boolean(),
  approvalLevels: z.array(z.string()).min(1, 'Select at least one level if approval is required'),
  approvalDeadline: z.enum(['End of Day', 'Next Morning', 'End of Week']),
  rejectReasonRequired: z.boolean(),
  approvalNotifications: z.boolean()
});

const APPROVAL_LEVELS = ['Teacher', 'Class Teacher', 'HOD', 'Principal'];

export const ApprovalWorkflowSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: initialData || { approvalLevels: [] }
  });

  const requireApproval = watch('requireAttendanceApproval');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => attendanceSettingsService.updateAttendanceSection('approval', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['attendanceSettings'], data);
      setIsEditing(false);
      reset(data.approval);
    }
  });

  const isMatch = searchQuery && (
    'Approval Workflow'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'approval'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Approval Workflow"
        description="Configure multi-level approval chains for submitted attendance records."
        icon={CheckSquare}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit((data) => mutation.mutate(data))}
        onReset={() => reset(initialData)}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <input type="checkbox" {...register('requireAttendanceApproval')} disabled={!isEditing} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span className="block text-sm font-semibold text-slate-900">Require Attendance Approval</span>
                <span className="block text-xs text-slate-500 mt-0.5">Route submitted attendance through a defined hierarchy before finalizing.</span>
              </div>
            </div>

            {requireApproval && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Approval Hierarchy *</label>
                  <Controller
                    name="approvalLevels"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {APPROVAL_LEVELS.map((level, index) => {
                          const isSelected = field.value?.includes(level);
                          return (
                            <div key={level} className="flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isEditing) return;
                                  const newValue = isSelected
                                    ? field.value.filter(l => l !== level)
                                    : [...(field.value || []), level];
                                  field.onChange(newValue);
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                                  isSelected 
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm" 
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                                  !isEditing && "cursor-default opacity-70"
                                )}
                              >
                                {level}
                              </button>
                              {isSelected && index < APPROVAL_LEVELS.length - 1 && (
                                <span className="mx-2 text-slate-300 font-bold">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.approvalLevels && <p className="mt-1 text-sm text-red-600">{errors.approvalLevels.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approval Deadline *</label>
                  <select {...register('approvalDeadline')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white">
                    <option value="End of Day">End of Day (Same Day)</option>
                    <option value="Next Morning">Next Morning (10:00 AM)</option>
                    <option value="End of Week">End of Week</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('rejectReasonRequired')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Require Reason When Rejecting</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" {...register('approvalNotifications')} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">Send Notifications to Approvers</span>
                  </label>
                </div>
              </>
            )}

          </div>
        </form>
      </SectionCard>
    </div>
  );
};
