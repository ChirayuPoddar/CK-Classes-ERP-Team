import React from 'react';
import { ShieldCheck, Activity, Users, AlertTriangle, Key, Lock, MonitorSmartphone } from 'lucide-react';

export const SecurityDashboardPanel = ({ settings }) => {
  if (!settings) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden lg:block sticky top-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          <ShieldCheck className="h-4 w-4 mr-2 text-green-600" /> Security Posture
        </h3>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold tracking-wide uppercase">
          Healthy
        </span>
      </div>
      
      <div className="p-5 space-y-6">
        
        {/* Metric 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Sessions</p>
              <p className="text-sm font-bold text-slate-900">1,248</p>
            </div>
          </div>
          <span className="text-xs text-green-600 font-medium flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span> Live
          </span>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Failed Logins (24h)</p>
              <p className="text-sm font-bold text-slate-900">42</p>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Locked Accounts</p>
              <p className="text-sm font-bold text-slate-900">3</p>
            </div>
          </div>
          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Review</button>
        </div>

        {/* Metric 4 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">2FA Adoption</p>
              <p className="text-sm font-bold text-slate-900">87%</p>
            </div>
          </div>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[87%] rounded-full"></div>
          </div>
        </div>

      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wider">Recent Events</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></div>
            <div>
              <p className="text-xs font-medium text-slate-900">Account locked: jdoe@example.com</p>
              <p className="text-[10px] text-slate-500">10 failed attempts • 2 mins ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></div>
            <div>
              <p className="text-xs font-medium text-slate-900">New device login (Unrecognized IP)</p>
              <p className="text-[10px] text-slate-500">admin@school.edu • 15 mins ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
