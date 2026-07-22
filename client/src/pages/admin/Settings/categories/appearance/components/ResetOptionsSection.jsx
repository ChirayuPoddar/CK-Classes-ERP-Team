import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';
import { useQueryClient } from '@tanstack/react-query';

export const ResetOptionsSection = ({ sectionId, searchQuery }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const resetData = await appearanceSettingsService.resetAll();
      queryClient.setQueryData(['appearanceSettings'], resetData);
      setConfirming(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const isMatch = searchQuery && (
    'Reset'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'default'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={`bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden ${isMatch ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
      <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">Reset Options</h3>
            <p className="text-sm text-red-700 mt-0.5">Danger zone. Restore factory defaults for the entire organization.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {confirming ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Are you absolutely sure?</h4>
                <p className="text-sm text-red-700 mt-1">
                  This action will permanently wipe all custom branding, themes, layouts, and accessibility configurations across the entire ERP. This cannot be undone.
                </p>
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={handleReset}
                    disabled={isResetting}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 flex items-center"
                  >
                    {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Yes, Reset Everything
                  </button>
                  <button 
                    onClick={() => setConfirming(false)}
                    disabled={isResetting}
                    className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-bold rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Restore Factory Settings</h4>
              <p className="text-sm text-slate-500 mt-1">Revert all appearance and personalization settings to default.</p>
            </div>
            <button 
              onClick={() => setConfirming(true)}
              className="px-4 py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors"
            >
              Reset Everything
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
