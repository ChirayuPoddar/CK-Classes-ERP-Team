import React, { useState } from 'react'
import {
  Lock,
  Unlock,
  Download,
  Trash2,
  Copy,
  Archive,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function BulkActionBar({
  selectedIds = [],
  totalFilteredCount = 0,
  onSelectAllFiltered,
  onClearSelection,
  onBulkLock,
  onBulkUnlock,
  onExportSelected,
  onBulkDuplicate,
  onBulkArchive,
  onBulkDelete,
  processing = false,
  progress = { current: 0, total: 0 }
}) {
  const [confirmModalAction, setConfirmModalAction] = useState(null)

  if (selectedIds.length === 0) return null

  const isAllSelected = selectedIds.length === totalFilteredCount && totalFilteredCount > 0

  const handleTriggerActionWithConfirm = (actionType) => {
    if (actionType === 'delete' || actionType === 'archive' || actionType === 'lock') {
      setConfirmModalAction(actionType)
    } else if (actionType === 'unlock') {
      onBulkUnlock()
    } else if (actionType === 'export') {
      onExportSelected()
    } else if (actionType === 'duplicate') {
      onBulkDuplicate()
    }
  }

  const handleExecuteConfirmedAction = () => {
    if (confirmModalAction === 'delete') onBulkDelete()
    else if (confirmModalAction === 'archive') onBulkArchive()
    else if (confirmModalAction === 'lock') onBulkLock()
    setConfirmModalAction(null)
  }

  return (
    <>
      {/* Floating Bottom Contextual Bulk Action Bar */}
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[92%] sm:w-auto max-w-4xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none print:hidden"
      >
        {/* Selection Count Badge & Select All */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="h-7 px-3 rounded-full bg-brand-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
            <span>{selectedIds.length}</span>
            <span>Selected</span>
          </span>

          <button
            type="button"
            onClick={onSelectAllFiltered}
            className="text-[11px] font-extrabold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            {isAllSelected ? <CheckSquare className="h-3.5 w-3.5 text-brand-blue-400" /> : <Square className="h-3.5 w-3.5" />}
            <span>{isAllSelected ? 'Deselect All' : `Select All (${totalFilteredCount})`}</span>
          </button>
        </div>

        {/* Processing Indicator if multi-item operation running */}
        {processing ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs font-extrabold text-brand-blue-400 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Processing {progress.current} of {progress.total}...</span>
          </div>
        ) : (
          /* Supported Action Buttons */
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              onClick={() => handleTriggerActionWithConfirm('lock')}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Lock Selected Sessions"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <button
              onClick={() => handleTriggerActionWithConfirm('unlock')}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Unlock Selected Sessions"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unlock</span>
            </button>

            <button
              onClick={() => handleTriggerActionWithConfirm('export')}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export Selected CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => handleTriggerActionWithConfirm('duplicate')}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Duplicate Selected Sessions"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Duplicate</span>
            </button>

            <button
              onClick={() => handleTriggerActionWithConfirm('archive')}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Archive Selected Sessions"
            >
              <Archive className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Archive</span>
            </button>

            <button
              onClick={() => handleTriggerActionWithConfirm('delete')}
              className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Delete Selected Sessions"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <button
              onClick={onClearSelection}
              className="h-8 w-8 rounded-full border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Clear Selection (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* ACTION CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmModalAction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h4 className="text-base font-black text-slate-800">
                  Confirm Bulk {confirmModalAction.toUpperCase()}
                </h4>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                You are about to perform <strong>{confirmModalAction}</strong> on <strong>{selectedIds.length}</strong> selected attendance session(s). Are you sure you want to proceed?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmModalAction(null)}
                  className="h-8.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConfirmedAction}
                  className={cn(
                    "h-8.5 px-4 rounded-xl text-white text-xs font-black cursor-pointer shadow-xs",
                    confirmModalAction === 'delete' ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-blue-600 hover:bg-brand-blue-700"
                  )}
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
