import React from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { useNavigate } from 'react-router-dom';

export const HolidaySection = ({ sectionId, searchQuery }) => {
  const navigate = useNavigate();

  const isMatch = searchQuery && (
    'Holiday Summary'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Read-only'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Holiday Summary"
        description="Overview of institutional holidays and working days."
        icon={CalendarDays}
        isEditing={false}
        setIsEditing={() => {}}
        hasUnsavedChanges={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <h4 className="text-3xl font-bold text-indigo-600 mb-1">0</h4>
              <p className="text-xs font-medium text-slate-500 uppercase">Current Holidays</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <h4 className="text-3xl font-bold text-amber-500 mb-1">4</h4>
              <p className="text-xs font-medium text-slate-500 uppercase">Upcoming Holidays</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <h4 className="text-3xl font-bold text-emerald-600 mb-1">214</h4>
              <p className="text-xs font-medium text-slate-500 uppercase">Working Days</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <h4 className="text-3xl font-bold text-slate-700 mb-1">24</h4>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Holidays</p>
            </div>
          </div>
          
          <div className="md:col-span-1 flex items-center justify-center">
            <button 
              onClick={() => navigate('/admin/timetable')}
              className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-700 hover:text-indigo-600"
            >
              <span className="text-sm font-semibold">Manage Holidays</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
