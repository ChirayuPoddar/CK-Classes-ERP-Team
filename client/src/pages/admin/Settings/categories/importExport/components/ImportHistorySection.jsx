import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Download, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { importExportService } from '@/services/importExportService';

export const ImportHistorySection = ({ sectionId, searchQuery }) => {
  const [filter, setFilter] = useState('All');
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['importHistory'],
    queryFn: importExportService.getImportHistory
  });

  const isMatch = searchQuery && (
    'Import History'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'logs'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history?.filter(b => filter === 'All' ? true : b.status.includes(filter)) || [];

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Import History & Audit Logs</h3>
            <p className="text-sm text-slate-500 mt-0.5">Review past data ingestion jobs and download error reports.</p>
          </div>
        </div>
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Job</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Records</th>
              <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Error Report</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500 animate-pulse">Loading history...</td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">No import records found.</td>
              </tr>
            ) : (
              filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{record.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{formatDate(record.date)} • {record.importedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                    {record.module}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'Completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {record.status}
                      </span>
                    ) : record.status === 'Completed with Errors' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3 mr-1" /> {record.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" /> {record.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{record.records} <span className="text-xs text-slate-500 font-normal">Success</span></div>
                    {record.failed > 0 && <div className="text-xs font-medium text-red-600">{record.failed} Failed</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {record.errors && record.errors.length > 0 ? (
                      <button className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                        <Download className="h-3 w-3 mr-1.5" /> CSV Log
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
