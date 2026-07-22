import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Download, CheckCircle2 } from 'lucide-react';
import { importExportService } from '@/services/importExportService';

export const ExportHistorySection = ({ sectionId, searchQuery }) => {
  const [filter, setFilter] = useState('All');
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['exportHistory'],
    queryFn: importExportService.getExportHistory
  });

  const isMatch = searchQuery && (
    'Export History'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'logs'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history?.filter(b => filter === 'All' ? true : b.status === filter) || [];

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
            <h3 className="text-lg font-bold text-slate-900">Export History & Logs</h3>
            <p className="text-sm text-slate-500 mt-0.5">Audit log of all data exports and file generations.</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Name</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Size</th>
              <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500 animate-pulse">Loading history...</td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">No export records found.</td>
              </tr>
            ) : (
              filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{record.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{formatDate(record.date)} • {record.exportedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                    {record.module}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {record.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                    {record.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                      <Download className="h-3 w-3 mr-1.5" /> File (7d TTL)
                    </button>
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
