import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, History, RotateCcw, Clock, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import api from '@/services/api'

export default function VersionHistoryPanel({ isOpen, onClose, slotId, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && slotId) {
      setLoading(true)
      api.get(`/timetable/${slotId}/versions`)
        .then(res => {
          if (res.success) setVersions(res.data || [])
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [isOpen, slotId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-brand-blue-600" />
            <div>
              <h3 className="text-sm font-black text-slate-800">Version History & Audit Log</h3>
              <p className="text-[10px] font-bold text-slate-400">Track all changes, edits, and swaps for this slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">Loading history...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">No previous versions recorded.</div>
          ) : (
            versions.map((v) => (
              <div key={v._id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-2 relative pl-4">
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-blue-500 rounded-r-full" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">Version {v.version} ({v.action})</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(v.changedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600">{v.description || 'Slot modified'}</p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
