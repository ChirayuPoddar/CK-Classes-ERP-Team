import React from 'react';
import { Server } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';

export const SystemInfoSection = ({ sectionId, searchQuery }) => {
  const systemInfo = [
    { label: 'ERP Version', value: 'v2.4.1 (Enterprise)' },
    { label: 'Database Version', value: 'MongoDB 6.0.4' },
    { label: 'API Version', value: 'v1.2.0' },
    { label: 'Last Backup', value: new Date().toLocaleDateString() + ' 03:00 AM' },
    { label: 'Created Date', value: 'Jan 15, 2024' },
    { label: 'Last Updated', value: new Date().toLocaleDateString() },
    { label: 'Organization ID', value: 'ORG-CK-99412-XA' }
  ];

  const isMatch = searchQuery && (
    'System Information'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'version'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="System Information"
        description="Read-only diagnostic and version information for support purposes."
        icon={Server}
        isEditing={false}
        setIsEditing={() => {}}
        hasUnsavedChanges={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          {systemInfo.map((info, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{info.label}</p>
              <p className="text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {info.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
