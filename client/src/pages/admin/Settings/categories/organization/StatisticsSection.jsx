import React from 'react';
import { BarChart3, Users, BookOpen, GraduationCap, Building } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';

export const StatisticsSection = ({ sectionId, searchQuery }) => {
  // In a real app, this would use React Query to fetch real data from the dashboard endpoint
  const stats = [
    { label: 'Total Students', value: '1,245', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Teachers', value: '84', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Departments', value: '12', icon: Building, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Subjects', value: '48', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Classes', value: '36', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Rooms', value: '42', icon: Building, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Attendance Rate', value: '94.2%', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Timetables Gen.', value: '142', icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  const isMatch = searchQuery && (
    'Organization Statistics'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Read-only'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Organization Statistics"
        description="Read-only summary of the current ERP utilization and data."
        icon={BarChart3}
        isEditing={false} // Read-only section
        setIsEditing={() => {}} 
        hasUnsavedChanges={false}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-lg ${stat.bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h4>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};
