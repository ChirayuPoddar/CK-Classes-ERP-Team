const STORAGE_KEY = 'mock_security_settings';

const INITIAL_SETTINGS = {
  passwordPolicy: {
    minLength: 12,
    maxLength: 64,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiration: 90, // days
    preventPasswordReuse: 5, // last 5 passwords
    minimumAge: 1 // days
  },
  sessionManagement: {
    sessionTimeout: 120, // minutes
    idleTimeout: 30, // minutes
    maxConcurrentSessions: 3,
    rememberMeDuration: 30, // days
    autoLogout: true,
    forceLogoutAfterPasswordChange: true,
    sessionRefreshInterval: 5 // minutes
  },
  loginSecurity: {
    maxFailedAttempts: 5,
    accountLockDuration: 30, // minutes
    permanentLockThreshold: 10,
    captchaAfterFailedAttempts: 3,
    loginCooldown: 5, // seconds
    requireEmailVerification: false,
    requirePhoneVerification: false,
    loginAlerts: true
  },
  twoFactorAuth: {
    enable2FA: true,
    enforce2FA: false,
    authenticatorApp: true,
    emailOTP: true,
    smsOTP: false,
    backupCodes: true,
    trustedDevices: 30 // days
  },
  accessRestrictions: {
    allowedIPs: '', // Comma separated
    blockedIPs: '', // Comma separated
    countryRestrictions: '', // Comma separated ISO codes
    officeNetworkOnly: false,
    vpnRequirement: false,
    schoolNetworkRequirement: false,
    weekendLoginRules: 'Warn' // Allow, Warn, Block
  },
  auditLogging: {
    enableAuditLogs: true,
    retentionPeriod: 365, // days
    logUserActions: true,
    logAdminActions: true,
    logSecurityEvents: true,
    logPermissionChanges: true,
    logConfigurationChanges: true
  },
  securityAlerts: {
    multipleFailedLogins: ['Email', 'In-App'],
    newDeviceLogin: ['Email', 'In-App'],
    passwordChanged: ['Email'],
    roleChanged: ['Email', 'In-App'],
    permissionChanged: ['Email'],
    suspiciousLogin: ['Email', 'SMS'],
    accountLocked: ['Email', 'In-App']
  },
  dataProtection: {
    sensitiveDataMasking: true,
    exportRestrictions: 'Admins Only', // All, Admins Only, Blocked
    downloadRestrictions: 'None',
    clipboardProtection: false,
    screenshotWarning: false,
    dataRetention: 365, // days
    automaticDataCleanup: true
  }
};

const MOCK_DEVICES = [
  { id: '1', os: 'macOS', browser: 'Chrome', type: 'Desktop', ip: '192.168.1.4', lastActive: new Date().toISOString(), isCurrent: true, status: 'Active' },
  { id: '2', os: 'iOS', browser: 'Safari', type: 'Mobile', ip: '10.0.0.12', lastActive: new Date(Date.now() - 86400000).toISOString(), isCurrent: false, status: 'Active' },
  { id: '3', os: 'Windows 11', browser: 'Edge', type: 'Desktop', ip: '192.168.1.15', lastActive: new Date(Date.now() - 86400000 * 5).toISOString(), isCurrent: false, status: 'Blocked' }
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

const getDevices = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_DEVICES;
};

const performEmergencyAction = async (action) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, message: `Emergency action '${action}' completed successfully.` };
};

const resetAll = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
};

export const securitySettingsService = {
  getSettings,
  updateSection,
  getDevices,
  performEmergencyAction,
  resetAll,
  INITIAL_SETTINGS
};
