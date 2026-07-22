import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export const TimetablePreview = ({ settings }) => {
  if (!settings) return null;

  const { general, period, appearance } = settings;

  // Compute mock blocks based on settings
  const periods = general.maxPeriodsPerDay || 8;
  const breakDuration = period.breakDuration || 15;
  const lunchDuration = period.lunchDuration || 45;
  
  const isCompact = appearance?.compactMode;
  const hasWeekendHighlight = appearance?.weekendHighlighting;
  const isColorCoded = appearance?.colorCoding !== 'None';

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          {general.defaultView} View
        </span>
      </div>

      <div className="p-6 bg-slate-50">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div className="text-xs font-bold text-slate-400 uppercase text-center py-2">Time</div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
              <div key={day} className="text-xs font-bold text-slate-700 uppercase text-center py-2 bg-slate-50 rounded-md">
                {day}
              </div>
            ))}
          </div>

          {/* Time Blocks */}
          <div className="space-y-2">
            {Array.from({ length: Math.min(periods, 6) }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="grid grid-cols-6 gap-2">
                  <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center border-r border-slate-100">
                    {8 + i}:00
                  </div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <div 
                      key={`${day}-${i}`}
                      className={`
                        rounded-lg border flex items-center justify-center flex-col text-center
                        ${isCompact ? 'py-2' : 'py-3'}
                        ${isColorCoded ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'}
                      `}
                    >
                      <span className={`text-[10px] font-bold ${isColorCoded ? 'text-indigo-700' : 'text-slate-700'}`}>
                        MATH
                      </span>
                      {!isCompact && (
                        <span className="text-[9px] text-slate-400 mt-1">Mr. Smith</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Simulated Breaks */}
                {i === 2 && (
                  <div className="grid grid-cols-6 gap-2 my-1">
                    <div className="col-start-2 col-span-5 bg-orange-50 border border-orange-100 rounded text-[10px] text-orange-600 font-medium py-1 text-center flex items-center justify-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Short Break ({breakDuration}m)
                    </div>
                  </div>
                )}
                {i === 4 && (
                  <div className="grid grid-cols-6 gap-2 my-1">
                    <div className="col-start-2 col-span-5 bg-emerald-50 border border-emerald-100 rounded text-[10px] text-emerald-600 font-medium py-1 text-center flex items-center justify-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Lunch Break ({lunchDuration}m)
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <p>Mock data based on current settings.</p>
          <p>Total Periods: {periods}</p>
        </div>
      </div>
    </div>
  );
};
