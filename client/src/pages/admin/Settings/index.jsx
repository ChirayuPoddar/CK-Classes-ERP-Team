import React, { useState, useEffect } from 'react';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsSidebar } from './components/SettingsSidebar';
import { OrganizationSettings } from './categories/OrganizationSettings';
import { PlaceholderSettings } from './categories/PlaceholderSettings';
import { 
  Building2, Users, CheckSquare, Calendar, 
  Bell, Palette, Shield, DatabaseBackup, 
  ArrowLeftRight, FileText 
} from 'lucide-react';

const SETTINGS_CATEGORIES = [
  {
    id: 'organization',
    title: 'Organization',
    description: 'Manage school details, contact information, and regional settings',
    icon: Building2,
    component: OrganizationSettings
  },
  {
    id: 'users-roles',
    title: 'Users & Roles',
    description: 'Configure role-based access control and user management policies',
    icon: Users,
    component: PlaceholderSettings
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Set up attendance rules, leave policies, and tracking preferences',
    icon: CheckSquare,
    component: PlaceholderSettings
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Configure scheduling parameters, break times, and working days',
    icon: Calendar,
    component: PlaceholderSettings
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage email, SMS, and in-app notification templates and triggers',
    icon: Bell,
    component: PlaceholderSettings
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize branding, logos, colors, and user interface themes',
    icon: Palette,
    component: PlaceholderSettings
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Manage password policies, 2FA, session timeouts, and IP whitelisting',
    icon: Shield,
    component: PlaceholderSettings
  },
  {
    id: 'backup-restore',
    title: 'Backup & Restore',
    description: 'Schedule automated database backups and manage system restoration points',
    icon: DatabaseBackup,
    component: PlaceholderSettings
  },
  {
    id: 'import-export',
    title: 'Import & Export',
    description: 'Configure data migration tools, bulk uploads, and export formats',
    icon: ArrowLeftRight,
    component: PlaceholderSettings
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    description: 'View system-wide activity logs, audit trails, and compliance reports',
    icon: FileText,
    component: PlaceholderSettings
  }
];

const Settings = () => {
  // State initialization
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    return localStorage.getItem('lastOpenedSettingsCategory') || 'organization';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Persist last opened category
  useEffect(() => {
    localStorage.setItem('lastOpenedSettingsCategory', activeCategoryId);
  }, [activeCategoryId]);

  // Find active category data
  const activeCategory = SETTINGS_CATEGORIES.find(c => c.id === activeCategoryId) || SETTINGS_CATEGORIES[0];
  const ActiveComponent = activeCategory.component;

  // Handlers
  const handleSelectCategory = (id) => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    setActiveCategoryId(id);
    setSearchQuery(''); // clear search when navigating
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    // In a real app, this would trigger an API call based on the active category
    console.log(`Saving ${activeCategoryId} settings...`);
    setHasUnsavedChanges(false);
    // Add a toast notification here in future
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to discard all unsaved changes?")) {
      // Force re-render of component by toggling state or relying on the component's own reset logic
      // For simplicity in this architecture demo, we just clear the flag
      setHasUnsavedChanges(false);
      // In a real app, we'd trigger a re-fetch or pass a reset trigger prop
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Settings Header (Sticky) */}
      <SettingsHeader 
        title={activeCategory.title}
        description={activeCategory.description}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Settings Body Layout (Two-column) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <SettingsSidebar 
          categories={SETTINGS_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
        />

        {/* Right Content Panel */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FB]">
          <ActiveComponent 
            category={activeCategory} 
            setHasUnsavedChanges={setHasUnsavedChanges} 
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
