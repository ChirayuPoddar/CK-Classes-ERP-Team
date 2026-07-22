const STORAGE_KEY = 'mock_notification_settings';

const INITIAL_SETTINGS = {
  global: {
    enableNotifications: true,
    enableInApp: true,
    enableEmail: true,
    enableSMS: false,
    enablePush: false,
    quietHours: true,
    maxPerHour: 10,
    retryAttempts: 3
  },
  attendance: {
    marked: true,
    missing: true,
    lateArrival: true,
    earlyLeave: true,
    lowWarning: true,
    locked: false,
    approved: false,
    rejected: true,
    recipients: ['Students', 'Parents', 'Class Teachers']
  },
  timetable: {
    published: true,
    updated: true,
    roomChanged: true,
    teacherChanged: true,
    periodCancelled: true,
    extraClassAdded: true,
    holidayAdded: true,
    substitutionAssigned: true,
    recipients: ['Students', 'Teachers']
  },
  userManagement: {
    userCreated: true,
    roleAssigned: true,
    roleChanged: false,
    passwordReset: true,
    accountLocked: true,
    accountUnlocked: true,
    newLogin: false,
    failedLogin: true
  },
  system: {
    serverMaintenance: true,
    backupCompleted: false,
    backupFailed: true,
    storageWarning: true,
    systemUpdate: true,
    versionUpgrade: true,
    licenseExpiry: true,
    dbHealth: true
  },
  academic: {
    semesterStarted: true,
    semesterEnding: true,
    examSchedulePublished: true,
    holidayAnnounced: true,
    assignmentDeadline: true,
    classCancelled: true,
    eventReminder: true
  },
  channels: {
    inApp: { enabled: true, priority: 'High', retryPolicy: 'Linear', timeout: 5 },
    email: { enabled: true, priority: 'Medium', retryPolicy: 'Exponential', timeout: 30 },
    sms: { enabled: false, priority: 'High', retryPolicy: 'Linear', timeout: 10 },
    push: { enabled: false, priority: 'Low', retryPolicy: 'None', timeout: 5 },
    webhook: { enabled: false, priority: 'Low', retryPolicy: 'Exponential', timeout: 60 }
  },
  recipientGroups: {
    administrators: true,
    principals: true,
    hods: true,
    teachers: true,
    classTeachers: true,
    students: true,
    parents: true,
    departmentStaff: false
  },
  templates: [
    {
      id: 1,
      name: 'Attendance Warning',
      subject: 'Low Attendance Warning for {{StudentName}}',
      message: 'Dear Parent, your ward {{StudentName}} has an attendance of {{AttendancePercentage}}% which is below the required threshold. Please ensure regular attendance.',
      language: 'English',
      category: 'Attendance'
    },
    {
      id: 2,
      name: 'Room Change Alert',
      subject: 'Room Change: {{Class}}',
      message: 'The room for {{Class}} at {{Period}} has been changed. Please check your updated timetable.',
      language: 'English',
      category: 'Timetable'
    }
  ],
  quietHours: {
    startTime: '22:00',
    endTime: '06:00',
    weekendRules: 'Strict (Block All)',
    holidayRules: 'Relaxed (Allow Important)',
    emergencyOverride: true,
    priorityIgnore: true
  }
};

// Mock history data
const MOCK_HISTORY = [
  { id: 1, notification: 'Attendance Warning', recipient: 'john.parent@email.com', channel: 'Email', status: 'Delivered', sentTime: '2024-05-10T08:30:00Z', deliveryTime: '2024-05-10T08:30:12Z' },
  { id: 2, notification: 'Room Change', recipient: '+1234567890', channel: 'SMS', status: 'Failed', sentTime: '2024-05-10T09:15:00Z', deliveryTime: '-' },
  { id: 3, notification: 'Timetable Published', recipient: 'All Students', channel: 'In-App', status: 'Opened', sentTime: '2024-05-11T10:00:00Z', deliveryTime: '2024-05-11T10:00:01Z' },
  { id: 4, notification: 'System Backup Failed', recipient: 'admin@erp.com', channel: 'Email', status: 'Delivered', sentTime: '2024-05-12T02:00:00Z', deliveryTime: '2024-05-12T02:00:05Z' }
];

const getSettings = async () => {
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

const updateTemplate = async (templateId, templateData) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const currentSettings = await getSettings();
  
  let newTemplates;
  if (templateId === 'new') {
    newTemplates = [...currentSettings.templates, { ...templateData, id: Date.now() }];
  } else {
    newTemplates = currentSettings.templates.map(t => 
      t.id === templateId ? { ...t, ...templateData } : t
    );
  }
  
  const updatedSettings = {
    ...currentSettings,
    templates: newTemplates
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  return updatedSettings;
};

const deleteTemplate = async (templateId) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const currentSettings = await getSettings();
  const updatedSettings = {
    ...currentSettings,
    templates: currentSettings.templates.filter(t => t.id !== templateId)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  return updatedSettings;
};

const getHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_HISTORY;
};

const sendTestNotification = async (type, payload) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Simulate random failure for realism, 10% chance
  if (Math.random() < 0.1) {
    throw new Error('Delivery timeout simulation');
  }
  return { success: true, message: `Test ${type} sent successfully to ${payload.recipient}` };
};

export const notificationSettingsService = {
  getSettings,
  updateSection,
  updateTemplate,
  deleteTemplate,
  getHistory,
  sendTestNotification
};
