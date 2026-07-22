import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Trash2, Edit3 } from 'lucide-react'

export default function QuickEditPopup({
  slot,
  position = { x: 0, y: 0 },
  onClose,
  onEditFull,
  onUnschedule
}) {
  if (!slot) return null

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="fixed z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-64 space-y-3 select-none text-left"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h4 className="text-xs font-black text-slate-800">{slot.subject?.name || 'Subject'}</h4>
          <span className="text-[10px] font-bold text-slate-400">{slot.class} • {slot.day}</span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="text-[11px] font-bold text-slate-600 space-y-1">
        <div>Teacher: <strong className="text-slate-800">{slot.teacher ? `${slot.teacher.firstName || ''} ${slot.teacher.lastName || ''}`.trim() : 'Unassigned'}</strong></div>
        <div>Room: <strong className="text-slate-800">{slot.room || 'No Room'}</strong></div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={onUnschedule}
          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Remove</span>
        </button>
        <button
          onClick={onEditFull}
          className="px-3 py-1.5 rounded-lg bg-brand-blue-600 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
        >
          <Edit3 className="h-3 w-3" />
          <span>Full Edit</span>
        </button>
      </div>
    </motion.div>
  )
}
