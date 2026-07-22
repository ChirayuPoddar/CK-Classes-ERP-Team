import React, { useState } from 'react';
import { Edit2, Save, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export const SectionCard = ({
  title,
  description,
  icon: Icon,
  children,
  isEditing,
  setIsEditing,
  onSave,
  onReset,
  isSubmitting,
  hasUnsavedChanges
}) => {
  return (
    <div className="bg-white rounded-xl shadow-premium-1 border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-premium-2">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </button>
          ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (onReset) onReset();
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                {hasUnsavedChanges && onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center px-3 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSubmitting || !hasUnsavedChanges}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                    (isSubmitting || !hasUnsavedChanges)
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                  )}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className={cn(
        "p-6 transition-opacity duration-300",
        !isEditing && "opacity-75 pointer-events-none grayscale-[0.2]"
      )}>
        {children}
      </div>
    </div>
  );
};
