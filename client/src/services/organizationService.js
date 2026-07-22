// MOCK SERVICE: Since we cannot modify the backend architecture right now,
// this service uses a local delay to simulate network requests, saving
// the organization settings data in localStorage for persistence.

const STORAGE_KEY = 'mock_organization_settings';

const MOCK_INITIAL_DATA = {
  profile: {
    schoolName: 'CK Classes ERP',
    shortName: 'CK ERP',
    tagline: 'Empowering Education through Technology',
    schoolType: 'University',
    affiliationBoard: 'State Board',
    institutionCode: 'CK2026',
    registrationNumber: 'REG-987654321',
    establishedYear: 2010,
    principalName: 'Dr. Sarah Connor',
    description: 'A premier institute for holistic education.',
    logoUrl: '',
    bannerUrl: ''
  },
  contact: {
    primaryEmail: 'admin@ckclasses.com',
    supportEmail: 'support@ckclasses.com',
    primaryPhone: '+91 98765 43210',
    secondaryPhone: '',
    website: 'https://ckclasses.com',
    emergencyContact: '+91 99999 00000',
    admissionContact: '+91 88888 11111',
    supportContact: '+91 77777 22222'
  },
  address: {
    addressLine1: '123 Education Lane',
    addressLine2: 'Knowledge City Sector 4',
    city: 'Metropolis',
    state: 'StateRegion',
    country: 'CountryLand',
    postalCode: '123456',
    latitude: 28.6139,
    longitude: 77.2090
  },
  academic: {
    currentYear: '2026-2027',
    semester: 'Fall',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    schoolStartTime: '08:00',
    schoolEndTime: '15:00',
    weekStartsOn: 'Monday',
    academicSession: 'Morning',
    defaultAttendancePercentage: 75,
    defaultClassDuration: 45,
    defaultBreakDuration: 15,
    lunchBreakDuration: 45
  },
  branding: {
    primaryColor: '#4f46e5', // indigo-600
    secondaryColor: '#f1f5f9', // slate-100
    accentColor: '#f59e0b', // amber-500
    faviconUrl: '',
    emailLogoUrl: '',
    reportLogoUrl: '',
    certificateLogoUrl: ''
  },
  social: {
    facebook: 'https://facebook.com/ckclasses',
    instagram: 'https://instagram.com/ckclasses',
    linkedin: 'https://linkedin.com/school/ckclasses',
    youtube: '',
    twitter: 'https://x.com/ckclasses',
    admissionPortal: 'https://admissions.ckclasses.com'
  }
};

const getOrganizationData = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    return JSON.parse(savedData);
  }
  
  // Initialize if empty
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL_DATA));
  return MOCK_INITIAL_DATA;
};

const updateOrganizationSection = async (sectionKey, data) => {
  // Simulate network latency (between 600ms to 1200ms)
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
  
  const currentData = await getOrganizationData();
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

export const organizationService = {
  getOrganizationData,
  updateOrganizationSection
};
