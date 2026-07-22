import React from 'react';
import { Search, ChevronRight, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsHeader = ({ 
  title, 
  description, 
  searchQuery, 
  setSearchQuery, 
  hasUnsavedChanges, 
  onSave, 
  onReset 
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm pt-6 pb-4 px-6 md:px-10">
      {/* Breadcrumb & Unsaved changes bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center text-sm text-slate-500 font-medium">
          <span>Admin</span>
          <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />
          <span>Settings</span>
          <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />
          <span className="text-slate-800">{title}</span>
        </div>

        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg"
            >
              <div className="flex items-center text-amber-700 text-sm font-semibold mr-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Unsaved changes
              </div>
              <button 
                onClick={onReset}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Discard
              </button>
              <button 
                onClick={onSave}
                className="flex items-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-1.5 rounded-md shadow-sm"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Title & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
