import React from 'react';
import { X, Monitor, Globe, Server, Hash, Clock, ShieldAlert } from 'lucide-react';

export const EventDetailsDrawer = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 overflow-y-auto">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Event Details</h3>
            <p className="text-[10px] font-mono text-slate-500 mt-1">{event.id}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Header Info */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                event.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                event.severity === 'Error' ? 'bg-orange-100 text-orange-700' :
                event.severity === 'Warning' ? 'bg-amber-100 text-amber-700' :
                event.severity === 'Success' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {event.severity}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.status === 'Success' ? 'text-green-600 border border-green-200 bg-green-50' : 'text-red-600 border border-red-200 bg-red-50'}`}>
                {event.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{event.action}</h2>
            <p className="text-sm text-slate-500 font-medium">{event.module} Module</p>
          </div>

          {/* Actor & Resource */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Actor</p>
              <p className="text-sm font-bold text-slate-900 truncate" title={event.user}>{event.user}</p>
              <p className="text-xs text-slate-500">{event.role}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Resource</p>
              <p className="text-sm font-bold text-slate-900 truncate" title={event.resource}>{event.resource}</p>
            </div>
          </div>

          {/* Context Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center">
              <Hash className="h-4 w-4 mr-2 text-slate-400" /> Event Context
            </h4>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-[11px] font-mono text-emerald-400">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
            {event.severity === 'Critical' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start text-xs text-red-800">
                <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                This event triggered an automated security alert to administrators.
              </div>
            )}
          </div>

          {/* Environment */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center">
              <Globe className="h-4 w-4 mr-2 text-slate-400" /> Environment
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Server className="h-4 w-4 text-slate-400 mr-3 w-5" />
                <span className="text-slate-500 w-24">IP Address:</span>
                <span className="font-medium text-slate-900 font-mono text-xs">{event.ip}</span>
              </li>
              <li className="flex items-center text-sm">
                <Monitor className="h-4 w-4 text-slate-400 mr-3 w-5" />
                <span className="text-slate-500 w-24">Device/OS:</span>
                <span className="font-medium text-slate-900">{event.device} • {event.os}</span>
              </li>
              <li className="flex items-center text-sm">
                <Globe className="h-4 w-4 text-slate-400 mr-3 w-5" />
                <span className="text-slate-500 w-24">Browser:</span>
                <span className="font-medium text-slate-900">{event.browser}</span>
              </li>
              <li className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-slate-400 mr-3 w-5" />
                <span className="text-slate-500 w-24">Timestamp:</span>
                <span className="font-medium text-slate-900">{formatDate(event.timestamp)}</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
            Close Panel
          </button>
        </div>

      </div>
    </>
  );
};
