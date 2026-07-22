const STORAGE_KEY = 'mock_attendance_settings';

const MOCK_INITIAL_DATA = {
  general: {
    attendanceMode: 'Daily',
    defaultStatus: 'Present',
    allowMultipleSessions: false,
    windowStartTime: '08:00',
    windowEndTime: '10:00',
    autoSaveDrafts: true,
    requireSubmission: true,
    enableHistory: true
  },
  workingDays: {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    weekendRules: 'Strict',
    holidayIntegration: true,
    halfDayRules: true,
    specialWorkingDays: false,
    examAttendanceRules: 'Separate',
    vacationHandling: 'Exclude',
    allowAttendanceDuringHolidays: false
  },
  lateArrival: {
    lateThreshold: 15,
    veryLateThreshold: 30,
    earlyLeaveThreshold: 15,
    gracePeriod: 5,
    markHalfDayAfter: 45,
    automaticStatusCalculation: true,
    allowManualOverride: true
  },
  absenceRules: {
    consecutiveAbsenceThreshold: 3,
    maximumAllowedAbsences: 10,
    excusedCategories: ['Medical', 'Sports', 'Official Duty'],
    medicalLeave: true,
    sportsLeave: true,
    officialDuty: true,
    customLeaveTypes: '',
    automaticParentAlerts: true,
    automaticTeacherAlerts: true
  },
  locking: {
    autoLockAttendance: true,
    lockTime: '15:00',
    manualLock: true,
    manualUnlock: false,
    overridePermission: 'Admin Only',
    reopenAttendanceWindow: false,
    requireReasonBeforeUnlocking: true
  },
  approval: {
    requireAttendanceApproval: true,
    approvalLevels: ['Class Teacher', 'Principal'],
    approvalDeadline: 'End of Day',
    rejectReasonRequired: true,
    approvalNotifications: true
  },
  riskDetection: {
    minimumAttendancePercentage: 75,
    riskLevelGreen: 90,
    riskLevelYellow: 80,
    riskLevelOrange: 70,
    riskLevelRed: 60,
    automaticRiskDetection: true,
    consecutiveAbsenceAlert: true,
    attendanceTrendMonitoring: true,
    enableRiskDashboard: true
  },
  notifications: {
    notifyStudents: true,
    notifyParents: true,
    notifyTeachers: true,
    attendanceReminder: true,
    lowAttendanceWarning: true,
    lateArrivalAlert: true,
    attendanceLockedNotification: true,
    approvalNotification: true,
    channels: ['In-App', 'Email']
  },
  reports: {
    defaultReportFormat: 'PDF',
    includePhotos: true,
    includeSignatures: false,
    includeRemarks: true,
    defaultDateRange: 'This Month',
    reportBranding: true
  },
  defaults: {
    defaultAttendancePercentage: 75,
    defaultClassDuration: 45,
    defaultSession: 'Morning',
    defaultStatus: 'Present',
    defaultRemarks: '',
    defaultFilters: 'Class-wise'
  }
};

const getAttendanceData = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    return JSON.parse(savedData);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL_DATA));
  return MOCK_INITIAL_DATA;
};

const updateAttendanceSection = async (sectionKey, data) => {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
  
  const currentData = await getAttendanceData();
  const updatedData = {
    ...currentData,
    [sectionKey]: {
      ...currentData[sectionKey],
      ...data
    }
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  return updatedData;
};

export const attendanceSettingsService = {
  getAttendanceData,
  updateAttendanceSection
};
