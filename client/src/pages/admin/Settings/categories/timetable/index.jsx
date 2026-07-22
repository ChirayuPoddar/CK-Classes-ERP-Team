import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timetableSettingsService } from '@/services/timetableSettingsService';
import { TimetablePreview } from './components/TimetablePreview';

import { GeneralSection } from './components/GeneralSection';
import { PeriodSection } from './components/PeriodSection';
import { TeacherRulesSection } from './components/TeacherRulesSection';
import { ClassroomRulesSection } from './components/ClassroomRulesSection';
import { SubjectRulesSection } from './components/SubjectRulesSection';
import { AutoGenerationSection } from './components/AutoGenerationSection';
import { ConstraintsSection } from './components/ConstraintsSection';
import { ClassPoolSection } from './components/ClassPoolSection';
import { AppearanceSection } from './components/AppearanceSection';
import { ExportPrintSection } from './components/ExportPrintSection';
import { NotificationsSection } from './components/NotificationsSection';
import { AnalyticsSection } from './components/AnalyticsSection';

export const TimetableSettings = ({ searchQuery, setHasUnsavedChanges }) => {
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['timetableSettings'],
    queryFn: timetableSettingsService.getSettings
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 flex flex-col xl:flex-row gap-8">
      
      {/* Left Column - Configuration Sections */}
      <div className="flex-1 space-y-8 min-w-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Timetable Settings</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure scheduling rules, appearance, and auto-generation algorithms.
          </p>
        </div>

        <div className="space-y-6">
          <GeneralSection initialData={initialData?.general} sectionId="general" searchQuery={searchQuery} />
          <PeriodSection initialData={initialData?.period} sectionId="period" searchQuery={searchQuery} />
          <TeacherRulesSection initialData={initialData?.teacherRules} sectionId="teacherRules" searchQuery={searchQuery} />
          <ClassroomRulesSection initialData={initialData?.classroomRules} sectionId="classroomRules" searchQuery={searchQuery} />
          <SubjectRulesSection initialData={initialData?.subjectRules} sectionId="subjectRules" searchQuery={searchQuery} />
          <AutoGenerationSection initialData={initialData?.autoGeneration} sectionId="autoGeneration" searchQuery={searchQuery} />
          <ConstraintsSection initialData={initialData?.constraints} sectionId="constraints" searchQuery={searchQuery} />
          <ClassPoolSection initialData={initialData?.classPool} sectionId="classPool" searchQuery={searchQuery} />
          <AppearanceSection initialData={initialData?.appearance} sectionId="appearance" searchQuery={searchQuery} />
          <ExportPrintSection initialData={initialData?.exportPrint} sectionId="exportPrint" searchQuery={searchQuery} />
          <NotificationsSection initialData={initialData?.notifications} sectionId="notifications" searchQuery={searchQuery} />
          <AnalyticsSection initialData={initialData?.analytics} sectionId="analytics" searchQuery={searchQuery} />
        </div>
      </div>

      {/* Right Column - Live Preview */}
      <div className="hidden xl:block w-[500px] shrink-0">
        <div className="sticky top-8">
          <TimetablePreview settings={initialData} />
        </div>
      </div>

    </div>
  );
};
