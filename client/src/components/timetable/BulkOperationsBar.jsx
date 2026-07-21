import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, User, MapPin, Copy, X, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function BulkOperationsBar({
  selectedCount = 0,
  onClearSelection,
  onBulkDelete,
  onBulkReplaceTeacher,
  onBulkReplaceRoom
}) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl border border-slate-700 flex items-center gap-4 select-none"
      >
        <span className="text-xs font-black bg-brand-blue-600 px-2.5 py-1 rounded-full text-white">
          {selectedCount} Selected
        </span>

        <div className="h-4 w-px bg-slate-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={onBulkReplaceTeacher}
            className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <User className="h-3.5 w-3.5 text-blue-400" />
            <span>Replace Teacher</span>
          </button>

          <button
            onClick={onBulkReplaceRoom}
            className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>Replace Room</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="px-3 py-1.5 rounded-xl hover:bg-red-950/80 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={onClearSelection}
          className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
