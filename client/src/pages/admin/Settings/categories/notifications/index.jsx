import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationSettingsService } from '@/services/notificationSettingsService';

import { GlobalNotificationsSection } from './components/GlobalNotificationsSection';
import { AttendanceNotificationsSection } from './components/AttendanceNotificationsSection';
import { TimetableNotificationsSection } from './components/TimetableNotificationsSection';
import { UserManagementNotificationsSection } from './components/UserManagementNotificationsSection';
import { SystemNotificationsSection } from './components/SystemNotificationsSection';
import { AcademicNotificationsSection } from './components/AcademicNotificationsSection';
import { DeliveryChannelsSection } from './components/DeliveryChannelsSection';
import { RecipientGroupsSection } from './components/RecipientGroupsSection';
import { NotificationTemplatesSection } from './components/NotificationTemplatesSection';
import { QuietHoursSection } from './components/QuietHoursSection';
import { NotificationHistorySection } from './components/NotificationHistorySection';
import { TestCenterSection } from './components/TestCenterSection';

export const NotificationSettings = ({ searchQuery }) => {
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: notificationSettingsService.getSettings
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Notification Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure notification behavior, delivery channels, templates, and communication rules across the ERP.
        </p>
      </div>

      <div className="space-y-6">
        <GlobalNotificationsSection initialData={initialData?.global} sectionId="global" searchQuery={searchQuery} />
        <AttendanceNotificationsSection initialData={initialData?.attendance} sectionId="attendance" searchQuery={searchQuery} />
        <TimetableNotificationsSection initialData={initialData?.timetable} sectionId="timetable" searchQuery={searchQuery} />
        <UserManagementNotificationsSection initialData={initialData?.userManagement} sectionId="userManagement" searchQuery={searchQuery} />
        <SystemNotificationsSection initialData={initialData?.system} sectionId="system" searchQuery={searchQuery} />
        <AcademicNotificationsSection initialData={initialData?.academic} sectionId="academic" searchQuery={searchQuery} />
        <DeliveryChannelsSection initialData={initialData?.channels} sectionId="channels" searchQuery={searchQuery} />
        <RecipientGroupsSection initialData={initialData?.recipientGroups} sectionId="recipientGroups" searchQuery={searchQuery} />
        <NotificationTemplatesSection initialData={initialData?.templates} sectionId="templates" searchQuery={searchQuery} />
        <QuietHoursSection initialData={initialData?.quietHours} sectionId="quietHours" searchQuery={searchQuery} />
        <NotificationHistorySection sectionId="history" searchQuery={searchQuery} />
        <TestCenterSection sectionId="test" searchQuery={searchQuery} />
      </div>

    </div>
  );
};
