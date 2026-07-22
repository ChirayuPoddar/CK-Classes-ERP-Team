import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceSettingsService } from '@/services/attendanceSettingsService';

// Import Sections
import { GeneralSection } from './GeneralSection';
import { WorkingDaysSection } from './WorkingDaysSection';
import { LateArrivalSection } from './LateArrivalSection';
import { AbsenceRulesSection } from './AbsenceRulesSection';
import { LockingSection } from './LockingSection';
import { ApprovalWorkflowSection } from './ApprovalWorkflowSection';
import { RiskDetectionSection } from './RiskDetectionSection';
import { NotificationsSection } from './NotificationsSection';
import { ReportsSection } from './ReportsSection';
import { DefaultsSection } from './DefaultsSection';

export const AttendanceSettings = ({ searchQuery }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendanceSettings'],
    queryFn: attendanceSettingsService.getAttendanceData,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 h-64 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h3 className="text-lg font-semibold text-red-600">Failed to load attendance settings</h3>
        <p className="text-slate-500 mt-2">Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">Attendance Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure all attendance rules, thresholds, workflows, and default behaviors globally.
        </p>
      </div>

      <div className="space-y-8">
        <GeneralSection initialData={data?.general} sectionId="attendance-general" searchQuery={searchQuery} />
        <WorkingDaysSection initialData={data?.workingDays} sectionId="attendance-working-days" searchQuery={searchQuery} />
        <LateArrivalSection initialData={data?.lateArrival} sectionId="attendance-late-arrival" searchQuery={searchQuery} />
        <AbsenceRulesSection initialData={data?.absenceRules} sectionId="attendance-absence-rules" searchQuery={searchQuery} />
        <LockingSection initialData={data?.locking} sectionId="attendance-locking" searchQuery={searchQuery} />
        <ApprovalWorkflowSection initialData={data?.approval} sectionId="attendance-approval" searchQuery={searchQuery} />
        <RiskDetectionSection initialData={data?.riskDetection} sectionId="attendance-risk" searchQuery={searchQuery} />
        <NotificationsSection initialData={data?.notifications} sectionId="attendance-notifications" searchQuery={searchQuery} />
        <ReportsSection initialData={data?.reports} sectionId="attendance-reports" searchQuery={searchQuery} />
        <DefaultsSection initialData={data?.defaults} sectionId="attendance-defaults" searchQuery={searchQuery} />
      </div>
    </div>
  );
};
