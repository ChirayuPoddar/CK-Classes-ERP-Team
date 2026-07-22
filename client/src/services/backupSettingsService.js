const STORAGE_KEY = 'mock_backup_settings';
const HISTORY_KEY = 'mock_backup_history';

const INITIAL_SETTINGS = {
  automaticBackups: {
    enabled: true,
    frequency: 'Daily', // Daily, Weekly, Monthly
    backupTime: '02:00',
    retentionPolicy: 30, // days
    compression: 'High', // None, Standard, High
    encryption: 'AES-256', // None, AES-128, AES-256
    verifyAfterCompletion: true,
    retryFailedBackup: true
  },
  backupVerification: {
    automaticIntegrityCheck: true,
    checksumValidation: true,
    corruptionDetection: true,
    recoverySimulation: false
  },
  disasterRecovery: {
    rpo: 24, // Recovery Point Objective (Hours)
    rto: 4,  // Recovery Time Objective (Hours)
    emergencyContacts: 'admin@school.edu, it-support@school.edu',
    recoveryTestSchedule: 'Quarterly' // Monthly, Quarterly, Annually
  },
  backupNotifications: {
    backupStarted: ['In-App'],
    backupCompleted: ['In-App', 'Email'],
    backupFailed: ['In-App', 'Email', 'SMS'],
    verificationFailed: ['In-App', 'Email'],
    restoreCompleted: ['In-App', 'Email'],
    storageRunningLow: ['In-App', 'Email']
  }
};

const INITIAL_HISTORY = [
  { id: 'bck_101', name: 'System Auto Backup', type: 'Automated', status: 'Completed', size: '2.4 GB', duration: '14m 32s', createdBy: 'System', date: new Date(Date.now() - 86400000).toISOString(), version: 'v1.12.0', modules: ['Entire ERP'] },
  { id: 'bck_102', name: 'Pre-deployment Backup', type: 'Manual', status: 'Completed', size: '2.4 GB', duration: '15m 10s', createdBy: 'Super Admin', date: new Date(Date.now() - 86400000 * 2).toISOString(), version: 'v1.11.5', modules: ['Entire ERP'] },
  { id: 'bck_103', name: 'Database Maintenance', type: 'Manual', status: 'Failed', size: '0 MB', duration: '2m 14s', createdBy: 'IT Admin', date: new Date(Date.now() - 86400000 * 5).toISOString(), error: 'Connection timeout to storage bucket.', version: 'v1.11.5', modules: ['Attendance', 'Users'] },
  { id: 'bck_104', name: 'System Auto Backup', type: 'Automated', status: 'Completed', size: '2.3 GB', duration: '13m 45s', createdBy: 'System', date: new Date(Date.now() - 86400000 * 8).toISOString(), version: 'v1.11.5', modules: ['Entire ERP'] }
];

const getSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  return JSON.parse(stored);
};

const updateSection = async (sectionId, data) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const currentSettings = await getSettings();
  const updatedSettings = {
    ...currentSettings,
    [sectionId]: { ...currentSettings[sectionId], ...data }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  return updatedSettings;
};

const getHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  }
  return JSON.parse(stored);
};

const performManualBackup = async (data, onProgress) => {
  // Simulate a long running backup process with progress updates
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Add to history
        const newBackup = {
          id: `bck_${Date.now()}`,
          name: data.backupName,
          type: 'Manual',
          status: 'Completed',
          size: `${(Math.random() * 1.5 + 0.5).toFixed(1)} GB`,
          duration: '0m 45s', // Simulated
          createdBy: 'Admin (You)',
          date: new Date().toISOString(),
          version: 'v1.12.0',
          modules: data.modules.length > 0 ? data.modules : ['Selected Modules']
        };
        
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || JSON.stringify(INITIAL_HISTORY));
        localStorage.setItem(HISTORY_KEY, JSON.stringify([newBackup, ...history]));
        
        onProgress(100);
        setTimeout(() => resolve({ success: true, message: 'Backup completed successfully.' }), 500);
      } else {
        onProgress(progress);
      }
    }, 400);
  });
};

const performRestore = async (backupId, modules, onProgress) => {
  // Simulate a long running restore process
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress(100);
        setTimeout(() => resolve({ success: true, message: 'Restore completed successfully. System rollback successful.' }), 500);
      } else {
        onProgress(progress);
      }
    }, 600);
  });
};

const deleteBackup = async (backupId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || JSON.stringify(INITIAL_HISTORY));
  const updatedHistory = history.filter(h => h.id !== backupId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return { success: true };
};

const simulateImport = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: 'Backup file validated and imported successfully.' };
};

const getDashboardMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    totalStorage: 500, // GB
    usedStorage: 184.5, // GB
    backupSuccessRate: 98.2, // %
    averageDuration: '14m 20s',
    readinessScore: 'A+'
  };
};

export const backupSettingsService = {
  getSettings,
  updateSection,
  getHistory,
  performManualBackup,
  performRestore,
  deleteBackup,
  simulateImport,
  getDashboardMetrics,
  INITIAL_SETTINGS
};
