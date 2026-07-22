const IMPORT_HISTORY_KEY = 'mock_import_history';
const EXPORT_HISTORY_KEY = 'mock_export_history';

const INITIAL_IMPORT_HISTORY = [
  { id: 'imp_101', name: 'Fall 2026 Students', module: 'Students', status: 'Completed', records: 450, failed: 0, importedBy: 'Admin', date: new Date(Date.now() - 86400000).toISOString(), duration: '45s', errors: [] },
  { id: 'imp_102', name: 'Q1 Teacher Roster', module: 'Teachers', status: 'Completed with Errors', records: 112, failed: 3, importedBy: 'Admin', date: new Date(Date.now() - 86400000 * 3).toISOString(), duration: '12s', errors: ['Row 14: Invalid Email', 'Row 45: Duplicate ID', 'Row 88: Missing Dept'] },
  { id: 'imp_103', name: 'Historical Attendance', module: 'Attendance', status: 'Failed', records: 0, failed: 1200, importedBy: 'System', date: new Date(Date.now() - 86400000 * 7).toISOString(), duration: '2m 10s', errors: ['Invalid date format in column C. Expected YYYY-MM-DD.'] },
];

const INITIAL_EXPORT_HISTORY = [
  { id: 'exp_201', name: 'Active Students List', module: 'Students', format: 'CSV', size: '1.2 MB', exportedBy: 'Admin', date: new Date(Date.now() - 86400000 * 2).toISOString(), duration: '5s', status: 'Completed' },
  { id: 'exp_202', name: 'Q3 Financial Analytics', module: 'Analytics', format: 'Excel', size: '4.5 MB', exportedBy: 'Super Admin', date: new Date(Date.now() - 86400000 * 5).toISOString(), duration: '14s', status: 'Completed' },
  { id: 'exp_203', name: 'System Settings Backup', module: 'Settings', format: 'JSON', size: '340 KB', exportedBy: 'Admin', date: new Date(Date.now() - 86400000 * 10).toISOString(), duration: '2s', status: 'Completed' },
];

const getDashboardMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    recentImports: 24,
    successfulImports: 21,
    failedImports: 3,
    pendingImports: 1,
    importedRecords: 12450,
    validationErrors: 42,
    successRate: 98.4
  };
};

const getImportHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const stored = localStorage.getItem(IMPORT_HISTORY_KEY);
  if (!stored) {
    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(INITIAL_IMPORT_HISTORY));
    return INITIAL_IMPORT_HISTORY;
  }
  return JSON.parse(stored);
};

const getExportHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const stored = localStorage.getItem(EXPORT_HISTORY_KEY);
  if (!stored) {
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(INITIAL_EXPORT_HISTORY));
    return INITIAL_EXPORT_HISTORY;
  }
  return JSON.parse(stored);
};

const simulateImport = async (data, onProgress) => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        const newImport = {
          id: `imp_${Date.now()}`,
          name: data.fileName || 'Manual Data Import',
          module: data.module,
          status: 'Completed',
          records: Math.floor(Math.random() * 500) + 50,
          failed: 0,
          importedBy: 'Admin (You)',
          date: new Date().toISOString(),
          duration: '14s',
          errors: []
        };
        
        const history = JSON.parse(localStorage.getItem(IMPORT_HISTORY_KEY) || JSON.stringify(INITIAL_IMPORT_HISTORY));
        localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify([newImport, ...history]));
        
        onProgress(100);
        setTimeout(() => resolve({ success: true, message: `Successfully imported ${newImport.records} records into ${data.module}.` }), 500);
      } else {
        onProgress(progress);
      }
    }, 500);
  });
};

const simulateExport = async (data, onProgress) => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        const newExport = {
          id: `exp_${Date.now()}`,
          name: `${data.module} Export`,
          module: data.module,
          format: data.format,
          size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
          exportedBy: 'Admin (You)',
          date: new Date().toISOString(),
          duration: '8s',
          status: 'Completed'
        };
        
        const history = JSON.parse(localStorage.getItem(EXPORT_HISTORY_KEY) || JSON.stringify(INITIAL_EXPORT_HISTORY));
        localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify([newExport, ...history]));
        
        onProgress(100);
        setTimeout(() => resolve({ success: true, message: `Successfully exported ${data.module} to ${data.format}.` }), 500);
      } else {
        onProgress(progress);
      }
    }, 400);
  });
};

export const importExportService = {
  getDashboardMetrics,
  getImportHistory,
  getExportHistory,
  simulateImport,
  simulateExport
};
