import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, LogOut, PowerOff, Shield, DownloadCloud } from 'lucide-react';
import { securitySettingsService } from '@/services/securitySettingsService';
import { cn } from '@/utils/cn';

export const EmergencyControlsSection = ({ sectionId, searchQuery }) => {
  const [activeAction, setActiveAction] = useState(null);
  const [status, setStatus] = useState({ message: '', type: '' });

  const handleEmergencyAction = async (actionId, label) => {
    setActiveAction(actionId);
    setStatus({ message: '', type: '' });
    try {
      const response = await securitySettingsService.performEmergencyAction(actionId);
      setStatus({ message: response.message, type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 5000);
    } catch (e) {
      setStatus({ message: 'Action failed. Please check network.', type: 'error' });
    } finally {
      setActiveAction(null);
    }
  };

  const isMatch = searchQuery && (
    'Emergency'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'lockdown'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ACTIONS = [
    { id: 'force_logout_all', label: 'Force Logout All Users', description: 'Instantly invalidates all active sessions (except yours).', icon: LogOut, color: 'text-amber-700', bg: 'bg-amber-50', hover: 'hover:bg-amber-100', border: 'border-amber-200' },
    { id: 'lockdown_mode', label: 'Emergency Lockdown', description: 'Blocks all incoming logins and API requests completely.', icon: ShieldAlert, color: 'text-red-700', bg: 'bg-red-50', hover: 'hover:bg-red-100', border: 'border-red-200' },
    { id: 'maintenance_mode', label: 'Maintenance Mode', description: 'Displays a friendly maintenance page to all non-admins.', icon: PowerOff, color: 'text-orange-700', bg: 'bg-orange-50', hover: 'hover:bg-orange-100', border: 'border-orange-200' },
    { id: 'readonly_mode', label: 'Enable Read-Only Mode', description: 'Prevents all database writes/updates system-wide.', icon: Shield, color: 'text-indigo-700', bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', border: 'border-indigo-200' },
    { id: 'generate_report', label: 'Generate Security Report', description: 'Compiles a forensic report of recent incidents.', icon: DownloadCloud, color: 'text-slate-700', bg: 'bg-slate-50', hover: 'hover:bg-slate-100', border: 'border-slate-200' }
  ];

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden ${isMatch ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">Emergency Controls</h3>
            <p className="text-sm text-red-700 mt-0.5">Danger zone. Execute global security overrides and containment protocols.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {status.message && (
          <div className={cn("mb-6 p-4 rounded-lg flex items-center", status.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACTIONS.map(action => (
            <div key={action.id} className={cn("p-4 border rounded-xl flex items-start justify-between transition-colors", action.bg, action.border)}>
              <div className="flex items-start">
                <action.icon className={cn("h-5 w-5 mr-3 mt-0.5", action.color)} />
                <div>
                  <h4 className={cn("text-sm font-bold", action.color)}>{action.label}</h4>
                  <p className={cn("text-xs mt-1 opacity-80", action.color)}>{action.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if(window.confirm(`Are you sure you want to execute: ${action.label}?`)) {
                    handleEmergencyAction(action.id, action.label);
                  }
                }}
                disabled={activeAction !== null}
                className={cn("px-3 py-1.5 text-xs font-bold rounded shadow-sm shrink-0 ml-4 transition-colors", action.bg, action.color, action.border, "border bg-white hover:bg-white/50 disabled:opacity-50")}
              >
                {activeAction === action.id ? 'Executing...' : 'Execute'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
