const AUDIT_LOGS_KEY = 'mock_audit_logs';

const generateMockLogs = () => {
  return [
    { id: 'evt_001', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), user: 'admin@school.edu', role: 'Super Admin', module: 'Authentication', action: 'Login', resource: 'System', status: 'Success', severity: 'Info', ip: '192.168.1.104', device: 'Desktop', browser: 'Chrome 114.0', os: 'Windows 11', details: { loginMethod: '2FA', duration: '2s' } },
    { id: 'evt_002', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), user: 'system_process', role: 'System', module: 'Backup', action: 'Backup', resource: 'Database', status: 'Success', severity: 'Success', ip: '127.0.0.1', device: 'Server', browser: 'N/A', os: 'Linux', details: { backupSize: '2.4 GB', duration: '14m 32s', type: 'Automated' } },
    { id: 'evt_003', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), user: 'unknown', role: 'Unknown', module: 'Authentication', action: 'Login', resource: 'System', status: 'Failed', severity: 'Critical', ip: '203.0.113.42', device: 'Mobile', browser: 'Safari', os: 'iOS', details: { reason: 'Invalid Password', attempt: 5, location: 'Unknown Region' } },
    { id: 'evt_004', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), user: 'principal@school.edu', role: 'Admin', module: 'Users', action: 'Role Assignment', resource: 'User: J. Smith', status: 'Success', severity: 'Warning', ip: '192.168.1.15', device: 'Laptop', browser: 'Edge', os: 'Windows 10', details: { oldRole: 'Teacher', newRole: 'Department Head' } },
    { id: 'evt_005', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), user: 'teacher1@school.edu', role: 'Teacher', module: 'Attendance', action: 'Edit', resource: 'Class 10A Attendance', status: 'Success', severity: 'Info', ip: '192.168.1.55', device: 'Tablet', browser: 'Chrome', os: 'Android', details: { changedRecords: 3, previousState: 'Absent', newState: 'Present' } },
    { id: 'evt_006', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), user: 'admin@school.edu', role: 'Super Admin', module: 'Settings', action: 'Configuration Change', resource: 'Backup Settings', status: 'Success', severity: 'Info', ip: '192.168.1.104', device: 'Desktop', browser: 'Chrome 114.0', os: 'Windows 11', details: { oldCompression: 'Standard', newCompression: 'High' } },
    { id: 'evt_007', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), user: 'admin@school.edu', role: 'Super Admin', module: 'Import & Export', action: 'Import', resource: 'Students', status: 'Error', severity: 'Error', ip: '192.168.1.104', device: 'Desktop', browser: 'Chrome 114.0', os: 'Windows 11', details: { recordsImported: 112, failedRecords: 3, reason: 'Validation Error' } }
  ];
};

const getLogs = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const stored = localStorage.getItem(AUDIT_LOGS_KEY);
  if (!stored) {
    const initial = generateMockLogs();
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const getDashboardMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const logs = await getLogs();
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const todayLogs = logs.filter(l => new Date(l.timestamp) >= today);
  
  return {
    totalEventsToday: todayLogs.length,
    criticalEvents: todayLogs.filter(l => l.severity === 'Critical').length,
    failedActions: todayLogs.filter(l => l.status === 'Failed' || l.status === 'Error').length,
    successfulActions: todayLogs.filter(l => l.status === 'Success').length,
    activeUsers: new Set(todayLogs.map(l => l.user)).size,
    recentLogins: todayLogs.filter(l => l.action === 'Login' && l.status === 'Success').length,
    configChanges: todayLogs.filter(l => l.action.includes('Configuration')).length,
    suspiciousActivities: [
      { id: 1, message: '5 failed logins from IP 203.0.113.42', time: '45 mins ago', severity: 'high' },
      { id: 2, message: 'Unusual role escalation for User J. Smith', time: '1 hour ago', severity: 'medium' }
    ]
  };
};

const simulateLiveEvent = async () => {
  const logs = await getLogs();
  const newEvent = {
    id: `evt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'system_monitor',
    role: 'System',
    module: 'Timetable',
    action: 'View',
    resource: 'Dashboard',
    status: 'Success',
    severity: 'Info',
    ip: '127.0.0.1',
    device: 'Server',
    browser: 'N/A',
    os: 'Linux',
    details: { automatedCheck: true }
  };
  const updatedLogs = [newEvent, ...logs];
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
  return newEvent;
};

const simulateExport = async (filters, onProgress) => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress(100);
        setTimeout(() => resolve({ success: true, message: `Audit logs exported successfully.` }), 500);
      } else {
        onProgress(progress);
      }
    }, 400);
  });
};

const INITIAL_SETTINGS = {
  retention: {
    period: 90,
    autoArchive: true,
    autoDelete: false,
    storageLimit: 50 // GB
  },
  notifications: {
    criticalEvents: ['Email', 'In-App'],
    securityEvents: ['Email'],
    massDeletions: ['Email', 'SMS']
  }
};

const getSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const stored = localStorage.getItem('mock_audit_settings');
  if (!stored) {
    localStorage.setItem('mock_audit_settings', JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  return JSON.parse(stored);
};

const updateSettings = async (section, data) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const currentSettings = await getSettings();
  const updatedSettings = {
    ...currentSettings,
    [section]: { ...currentSettings[section], ...data }
  };
  localStorage.setItem('mock_audit_settings', JSON.stringify(updatedSettings));
  return updatedSettings;
};


export const auditLogsService = {
  getLogs,
  getDashboardMetrics,
  simulateLiveEvent,
  simulateExport,
  getSettings,
  updateSettings
};
