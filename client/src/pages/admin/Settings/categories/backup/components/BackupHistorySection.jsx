import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Download, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { backupSettingsService } from '@/services/backupSettingsService';
import { cn } from '@/utils/cn';

export const BackupHistorySection = ({ sectionId, searchQuery }) => {
  const [filter, setFilter] = useState('All');
  
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useQuery({
    queryKey: ['backupHistory'],
    queryFn: backupSettingsService.getHistory
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete backup '${name}'? This cannot be undone.`)) {
      await backupSettingsService.deleteBackup(id);
      queryClient.invalidateQueries(['backupHistory']);
    }
  };

  const isMatch = searchQuery && (
    'History'.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <h3 className="text-lg font-bold text-slate-900">Backup History & Logs</h3>
            <p className="text-sm text-slate-500 mt-0.5">Audit log of all manual and automated backup events.</p>
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
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Size</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
              <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500 animate-pulse">Loading history...</td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">No backup records found.</td>
              </tr>
            ) : (
              filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{record.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{record.type} • {record.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'Completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {record.status}
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 w-fit">
                          <XCircle className="w-3 h-3 mr-1" /> {record.status}
                        </span>
                        {record.error && <span className="text-[10px] text-red-600 mt-1 max-w-[150px] truncate" title={record.error}>{record.error}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {record.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {record.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button disabled={record.status !== 'Completed'} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed p-1">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id, record.name)} className="text-slate-400 hover:text-red-600 p-1 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
        <span>Showing {filteredHistory.length} records</span>
        <button className="text-indigo-600 font-semibold hover:text-indigo-700">Export CSV</button>
      </div>
    </div>
  );
};
