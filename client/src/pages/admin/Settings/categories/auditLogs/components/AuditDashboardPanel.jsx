import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, XCircle, Users, ShieldAlert } from 'lucide-react';

export const AuditDashboardPanel = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden lg:block sticky top-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          <Activity className="h-4 w-4 mr-2 text-indigo-600" /> Daily Activity Monitor
        </h3>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold tracking-wide uppercase flex items-center">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Live
        </span>
      </div>
      
      <div className="p-5 space-y-6">
        
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-2xl font-black text-slate-900">{metrics.totalEventsToday.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Events</p>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
            <p className="text-2xl font-black text-red-600">{metrics.criticalEvents}</p>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1">Critical Events</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <Users className="h-4 w-4 mr-2 text-slate-400" /> Active Users Today
            </div>
            <span className="font-bold text-slate-900">{metrics.activeUsers}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Successful Actions
            </div>
            <span className="font-bold text-slate-900">{metrics.successfulActions}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium text-slate-700">
              <XCircle className="h-4 w-4 mr-2 text-red-500" /> Failed Actions
            </div>
            <span className="font-bold text-slate-900">{metrics.failedActions}</span>
          </div>
        </div>

        {metrics.suspiciousActivities?.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
              <ShieldAlert className="h-3 w-3 mr-1 text-amber-500" /> Suspicious Activity Detected
            </h4>
            <div className="space-y-3">
              {metrics.suspiciousActivities.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border text-xs ${alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                  <p className="font-semibold mb-1">{alert.message}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${alert.severity === 'high' ? 'text-red-500' : 'text-amber-600'}`}>{alert.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
