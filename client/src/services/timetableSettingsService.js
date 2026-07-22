const STORAGE_KEY = 'mock_timetable_settings';

const INITIAL_SETTINGS = {
  general: {
    academicYear: '2024-2025',
    semester: 'Semester 1',
    timetableType: 'Weekly',
    defaultView: 'Class-wise',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '08:00',
    endTime: '15:00',
    maxPeriodsPerDay: 8,
    maxPeriodsPerWeek: 40,
    defaultClassDuration: 45
  },
  period: {
    periodDuration: 45,
    breakDuration: 15,
    lunchDuration: 45,
    shortBreaks: 1,
    hasAssembly: true,
    hasActivity: true,
    allowDoublePeriods: false,
    allowTriplePeriods: false
  },
  teacherRules: {
    maxClassesPerDay: 6,
    maxClassesPerWeek: 28,
    minGapBetweenClasses: 1,
    maxConsecutiveClasses: 3,
    preferredFreePeriod: 'Afternoon',
    partTimeSupport: false,
    handleTeacherLeave: 'Auto-Substitute'
  },
  classroomRules: {
    enforceCapacity: true,
    preventConflicts: true,
    labPriority: 'Senior Classes'
  },
  subjectRules: {
    maxClassesPerWeek: 6,
    minClassesPerWeek: 1,
    preferPracticalAfternoon: true
  },
  autoGeneration: {
    enableAutoGeneration: true,
    conflictDetection: 'Strict',
    conflictResolution: 'Manual Override',
    optimizeWorkload: true,
    optimizeClassrooms: true,
    balanceDailySubjects: true,
    avoidConsecutiveSameSubject: true,
    autoAssignRooms: true,
    autoAssignTeachers: true,
    priority: 'Core Subjects First'
  },
  constraints: {
    teacherConflict: true,
    studentConflict: true,
    roomConflict: true,
    noDuplicatePeriods: true,
    noEmptyTimetable: false
  },
  classPool: {
    enableDragDrop: true,
    allowMultiSelect: false,
    allowDuplicateClasses: false,
    autoSort: true,
    horizontalLayout: false,
    showTeacherNames: true,
    showSubjectColors: true
  },
  appearance: {
    compactMode: false,
    rowHeight: 'Medium',
    gridDensity: 'Comfortable',
    weekendHighlighting: true,
    currentPeriodHighlight: true,
    stickyHeaders: true,
    colorCoding: 'Subject Based'
  },
  exportPrint: {
    defaultFormat: 'PDF',
    printLayout: 'Landscape',
    includeTeacherNames: true,
    includeRoomNumbers: true,
    includeBranding: true
  },
  notifications: {
    notifyTeachers: true,
    notifyStudents: false,
    notifyParents: false,
    notifyOnChange: true,
    notifyOnRoomChange: true,
    notifyOnSubstitution: true,
    channels: ['In-App']
  },
  analytics: {
    enableAnalytics: true,
    teacherWorkload: true,
    roomUtilization: true,
    conflictReports: true
  }
};

const getSettings = async () => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  return JSON.parse(stored);
};

const updateSection = async (sectionId, data) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const currentSettings = await getSettings();
  const updatedSettings = {
    ...currentSettings,
    [sectionId]: { ...currentSettings[sectionId], ...data }
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  return updatedSettings;
};

export const timetableSettingsService = {
  getSettings,
  updateSection
};
