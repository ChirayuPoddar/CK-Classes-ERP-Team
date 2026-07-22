const STORAGE_KEY = 'mock_appearance_settings';

const INITIAL_SETTINGS = {
  theme: {
    mode: 'System', // Light, Dark, System, Auto
  },
  branding: {
    primaryColor: '#4f46e5', // indigo-600
    secondaryColor: '#10b981', // emerald-500
    accentColor: '#f59e0b', // amber-500
    sidebarColor: '#1e293b', // slate-800
    navbarColor: '#ffffff', // white
    buttonStyle: 'Rounded', // Square, Rounded, Pill
    borderRadius: 'Medium', // None, Small, Medium, Large
    cardStyle: 'Shadow', // Flat, Bordered, Shadow
    applicationName: 'Enterprise School ERP'
  },
  layout: {
    sidebarWidth: 'Default', // Compact, Default, Wide
    sidebarCollapseMode: 'Hover', // Click, Hover
    navbarPosition: 'Sticky', // Static, Sticky
    stickyHeader: true,
    stickySidebar: true,
    contentWidth: 'Full', // Contained, Full
    pagePadding: 'Comfortable', // Compact, Comfortable, Spacious
    cardDensity: 'Comfortable', // Compact, Comfortable
    gridDensity: 'Comfortable' // Compact, Comfortable
  },
  dashboard: {
    defaultWidgets: ['attendanceSummary', 'upcomingExams', 'recentAnnouncements'],
    allowUserCustomization: true
  },
  table: {
    defaultRowsPerPage: 25,
    compactTables: false,
    alternateRowColors: true,
    stickyHeaders: true,
    columnDensity: 'Comfortable',
    rememberColumnVisibility: true
  },
  typography: {
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    headingScale: 'Standard', // Small, Standard, Large
    lineHeight: '1.5',
    letterSpacing: 'Normal',
    readableMode: false
  },
  animations: {
    pageAnimations: true,
    cardAnimations: true,
    hoverEffects: true,
    loadingAnimations: true,
    transitions: true,
    reducedMotion: false
  },
  language: {
    locale: 'en-US',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStartsOn: 'Monday',
    numberFormat: '1,234.56',
    currency: 'INR'
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindPalette: 'None', // None, Protanopia, Deuteranopia, Tritanopia
    screenReaderLabels: true
  },
  personalization: {
    profileTheme: 'Organization Default',
    favoriteModules: ['Attendance', 'Timetable'],
    defaultLandingPage: 'Dashboard',
    quickAccess: true
  }
};

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

const resetAll = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
};

export const appearanceSettingsService = {
  getSettings,
  updateSection,
  resetAll,
  INITIAL_SETTINGS
};
