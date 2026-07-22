import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { notificationSettingsService } from '@/services/notificationSettingsService';

export const TestCenterSection = ({ sectionId, searchQuery }) => {
  const [testType, setTestType] = useState('Email');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleTestSend = async (e) => {
    e.preventDefault();
    if (!recipient) return;
    
    setIsSending(true);
    setResult(null);
    try {
      const response = await notificationSettingsService.sendTestNotification(testType, { recipient });
      setResult({ success: true, message: response.message });
    } catch (error) {
      setResult({ success: false, message: error.message || 'Failed to send test notification.' });
    } finally {
      setIsSending(false);
    }
  };

  const isMatch = searchQuery && (
    'Test Center'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'test'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isMatch ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center space-x-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Test Center</h3>
          <p className="text-sm text-slate-500 mt-0.5">Send test notifications to verify channel configurations.</p>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleTestSend} className="max-w-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Channel to Test</label>
              <select 
                value={testType} 
                onChange={(e) => setTestType(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white"
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Push">Push Notification</option>
                <option value="In-App">In-App Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Test Recipient</label>
              <input 
                type="text" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={testType === 'Email' ? 'admin@example.com' : '+1234567890'}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 sm:text-sm bg-white"
                required
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSending || !recipient}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Test {testType}</>
              )}
            </button>
          </div>
          
          {result && (
            <div className={`mt-4 p-4 rounded-lg flex items-start ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
              )}
              <div className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
