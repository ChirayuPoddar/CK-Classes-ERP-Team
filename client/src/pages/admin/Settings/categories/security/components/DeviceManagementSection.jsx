import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Laptop, AlertTriangle, Monitor, Smartphone, Globe, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { securitySettingsService } from '@/services/securitySettingsService';
import { cn } from '@/utils/cn';

export const DeviceManagementSection = ({ sectionId, searchQuery }) => {
  const [filter, setFilter] = useState('');
  
  const { data: devices, isLoading } = useQuery({
    queryKey: ['securityDevices'],
    queryFn: securitySettingsService.getDevices
  });

  const isMatch = searchQuery && (
    'Device Management'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'device'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'browser'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDevices = devices?.filter(d => 
    d.os.toLowerCase().includes(filter.toLowerCase()) ||
    d.browser.toLowerCase().includes(filter.toLowerCase()) ||
    d.ip.includes(filter)
  );

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Device Management</h3>
            <p className="text-sm text-slate-500 mt-0.5">Monitor and revoke devices associated with your active sessions.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <input 
            type="text" 
            placeholder="Search by OS, Browser, or IP..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 w-full max-w-sm border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-slate-500 animate-pulse">Loading active devices...</div>
          ) : filteredDevices?.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">No devices match your search.</div>
          ) : (
            filteredDevices?.map((device) => (
              <div key={device.id} className={cn(
                "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between transition-colors",
                device.isCurrent ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-200 hover:border-slate-300"
              )}>
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "p-3 rounded-full mt-1",
                    device.isCurrent ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {device.type === 'Desktop' ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{device.os} • {device.browser}</h4>
                      {device.isCurrent && (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Current Session
                        </span>
                      )}
                      {device.status === 'Blocked' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Blocked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500">
                      <span className="flex items-center"><Globe className="h-3 w-3 mr-1" /> {device.ip}</span>
                      <span>Last active: {formatDate(device.lastActive)}</span>
                    </div>
                  </div>
                </div>

                {!device.isCurrent && (
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2 self-end sm:self-auto">
                    {device.status === 'Blocked' ? (
                      <button className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded flex items-center">
                        <ShieldCheck className="h-3 w-3 mr-1.5" /> Trust
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded flex items-center">
                        <ShieldOff className="h-3 w-3 mr-1.5" /> Block
                      </button>
                    )}
                    <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
