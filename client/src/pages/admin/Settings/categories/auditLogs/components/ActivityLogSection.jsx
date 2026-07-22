import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Search, Filter, Play, Pause, ChevronRight } from 'lucide-react';
import { auditLogsService } from '@/services/auditLogsService';
import { EventDetailsDrawer } from './EventDetailsDrawer';
import { cn } from '@/utils/cn';

export const ActivityLogSection = ({ sectionId, searchQuery }) => {
  const [filterModule, setFilterModule] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [localSearch, setLocalSearch] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: auditLogsService.getLogs
  });

  // Real-time Simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      // 30% chance to generate a new event every 3 seconds if live
      if (Math.random() > 0.7) {
        await auditLogsService.simulateLiveEvent();
        queryClient.invalidateQueries(['auditLogs']);
        queryClient.invalidateQueries(['auditMetrics']);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, queryClient]);

  const isMatch = searchQuery && (
    'Activity Log'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'search'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'filter'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = (logs || []).filter(log => {
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    const matchesSeverity = filterSeverity === 'All' || log.severity === filterSeverity;
    const searchTarget = `${log.user} ${log.resource} ${log.action}`.toLowerCase();
    const matchesSearch = !localSearch || searchTarget.includes(localSearch.toLowerCase());
    return matchesModule && matchesSeverity && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateString));
  };

  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Error': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Unified Activity Log</h3>
            <p className="text-sm text-slate-500 mt-0.5">Track every configuration change, login, and data modification.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <span className="text-xs font-bold text-slate-600 px-2 uppercase tracking-wider">Live Monitor</span>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={cn("px-3 py-1.5 rounded text-xs font-bold flex items-center transition-colors shadow-sm", isLive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200")}
          >
            {isLive ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Start</>}
          </button>
        </div>

      </div>

      {/* Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by username, resource, or action..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-indigo-500">
            <option value="All">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="Users">Users & Roles</option>
            <option value="Attendance">Attendance</option>
            <option value="Settings">Settings</option>
            <option value="Import & Export">Import & Export</option>
            <option value="Backup">Backup</option>
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-indigo-500">
            <option value="All">All Severities</option>
            <option value="Info">Info</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actor</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action & Module</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource</th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500 animate-pulse">Loading audit trail...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">No logs match your filters.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedEvent(log)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 font-mono">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getSeverityStyles(log.severity))}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]" title={log.user}>{log.user}</div>
                    <div className="text-[10px] text-slate-500">{log.role}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-bold text-slate-900">{log.action}</div>
                    <div className="text-[10px] text-slate-500">{log.module}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-slate-700 truncate max-w-[150px]" title={log.resource}>{log.resource}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 ml-auto" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EventDetailsDrawer 
        event={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </div>
  );
};
