import React, { useState, useEffect } from 'react';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsSidebar } from './components/SettingsSidebar';
import { OrganizationSettings } from './categories/organization';
import { UsersRolesSettings } from './categories/users-roles';
import { AttendanceSettings } from './categories/attendance';
import { TimetableSettings } from './categories/timetable';
import { NotificationSettings } from './categories/notifications';
import { AppearanceSettings } from './categories/appearance';
import { SecuritySettings } from './categories/security';
import { BackupSettings } from './categories/backup';
import { ImportExportSettings } from './categories/importExport';
import { AuditLogsSettings } from './categories/auditLogs';
import { PlaceholderSettings } from './categories/PlaceholderSettings';
import { 
  Building2, Users, CheckSquare, Calendar, 
  CreditCard, BookOpen, GraduationCap, Link, Shield,
  Bell, FileText, Smartphone, Globe, HardDrive, Share2,
  Palette, DatabaseBackup, ArrowLeftRight
} from 'lucide-react';

export const SETTINGS_CATEGORIES = [
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
    component: UsersRolesSettings
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Set up attendance rules, leave policies, and tracking preferences',
    icon: CheckSquare,
    component: AttendanceSettings
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Configure scheduling rules, constraints, appearance, and auto-generation',
    icon: Calendar,
    component: TimetableSettings
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage email, SMS, and in-app notification templates and triggers',
    icon: Bell,
    component: NotificationSettings
  },
  {
    id: 'appearance',
    title: 'Appearance & Personalization',
    description: 'Customize themes, branding, dashboard layouts, and accessibility',
    icon: Palette,
    component: AppearanceSettings
  },
  {
    id: 'security',
    title: 'Security & Identity',
    description: 'Configure password policies, 2FA, session timeouts, and access controls',
    icon: Shield,
    component: SecuritySettings
  },
  {
    id: 'backup-restore',
    title: 'Backup & Disaster Recovery',
    description: 'Configure automated backups, manual snapshots, and system restoration',
    icon: DatabaseBackup,
    component: BackupSettings
  },
  {
    id: 'import-export',
    title: 'Data Import & Export',
    description: 'Bulk import records, configure field mappings, and export system data',
    icon: ArrowLeftRight,
    component: ImportExportSettings
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs & Activity',
    description: 'Monitor system activity, security events, and manage retention policies',
    icon: FileText,
    component: AuditLogsSettings
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
