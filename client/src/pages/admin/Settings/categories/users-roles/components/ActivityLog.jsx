import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldAlert, LogIn, Monitor, Smartphone, Globe, RefreshCcw } from 'lucide-react';
import { iamService } from '@/services/iamService';

export const ActivityLog = ({ searchQuery }) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['iam_logs'],
    queryFn: iamService.getLogs
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-lg w-full" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg w-full" />)}
      </div>
    );
  }

  const getActionIcon = (action) => {
    if (action.includes('Login')) return <LogIn className="h-4 w-4 text-emerald-600" />;
    if (action.includes('Failed')) return <ShieldAlert className="h-4 w-4 text-red-600" />;
    if (action.includes('Permissions') || action.includes('Role')) return <ShieldAlert className="h-4 w-4 text-indigo-600" />;
    return <Activity className="h-4 w-4 text-slate-600" />;
  };

  const getDeviceIcon = (os) => {
    if (os.includes('iOS') || os.includes('Android')) return <Smartphone className="h-4 w-4 text-slate-400" />;
    if (os.includes('Mac') || os.includes('Windows')) return <Monitor className="h-4 w-4 text-slate-400" />;
    return <Globe className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Sessions</p>
            <h4 className="text-3xl font-bold text-slate-900">142</h4>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Monitor className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Failed Logins (24h)</p>
            <h4 className="text-3xl font-bold text-red-600">12</h4>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center gap-3">
          <button className="w-full flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            Force Logout All Users
          </button>
          <button className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Export Audit Log
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Security & Audit Log</h3>
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Device & IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(log.time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-md mr-3 ${log.action.includes('Failed') ? 'bg-red-50' : 'bg-slate-50'}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <span className={`text-sm ${log.action.includes('Failed') ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-500">
                      {getDeviceIcon(log.os)}
                      <span className="ml-2">{log.os} &bull; {log.browser}</span>
                      <span className="ml-3 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{log.ip}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
