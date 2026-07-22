import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';

const TEMPLATES = [
  { name: 'Students Template', desc: 'Includes ID, Name, Grade, Email, Parents.', size: '12 KB' },
  { name: 'Teachers Template', desc: 'Includes ID, Name, Dept, Subjects, Email.', size: '8 KB' },
  { name: 'Timetable Template', desc: 'Includes Class, Subject, Teacher, Time Slots.', size: '15 KB' },
  { name: 'Attendance Template', desc: 'Includes Date, Student ID, Status (P/A/L).', size: '10 KB' },
];

export const DataTemplatesSection = ({ sectionId, searchQuery }) => {
  
  const isMatch = searchQuery && (
    'Template'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'csv'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Download Data Templates</h3>
            <p className="text-sm text-slate-500 mt-0.5">Use these pre-formatted CSV templates to ensure successful imports.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {TEMPLATES.map(t => (
            <div key={t.name} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="pr-4">
                <h4 className="text-sm font-bold text-slate-900 mb-1">{t.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{t.desc}</p>
                <span className="text-[10px] font-semibold text-slate-400 mt-2 block uppercase">{t.size} • CSV</span>
              </div>
              <div className="p-2 bg-slate-100 text-slate-400 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                <Download className="h-4 w-4" />
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};
