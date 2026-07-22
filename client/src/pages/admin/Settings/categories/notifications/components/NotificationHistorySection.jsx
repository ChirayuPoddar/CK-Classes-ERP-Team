import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search, Filter } from 'lucide-react';
import { notificationSettingsService } from '@/services/notificationSettingsService';

export const NotificationHistorySection = ({ sectionId, searchQuery }) => {
  const [filter, setFilter] = useState('');
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['notificationHistory'],
    queryFn: notificationSettingsService.getHistory
  });

  const isMatch = searchQuery && (
    'Notification History'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'history'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'log'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history?.filter(item => 
    item.notification.toLowerCase().includes(filter.toLowerCase()) ||
    item.recipient.toLowerCase().includes(filter.toLowerCase()) ||
    item.status.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Notification History</h3>
            <p className="text-sm text-slate-500 mt-0.5">Read-only audit log of all dispatched notifications.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search history by recipient or status..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 bg-white"
            />
          </div>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notification</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">Loading history...</td>
                </tr>
              ) : filteredHistory?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">No records found.</td>
                </tr>
              ) : (
                filteredHistory?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.notification}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.channel}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'Delivered' || item.status === 'Opened' ? 'bg-green-100 text-green-800' :
                        item.status === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(item.sentTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
