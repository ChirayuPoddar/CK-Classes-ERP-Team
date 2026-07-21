import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Cpu, RefreshCw, Check, AlertCircle } from 'lucide-react'
import api from '@/services/api'

export default function AutoGeneratorModal({
  isOpen,
  onClose,
  currentClass = 'Class 1',
  academicYear = '2026-2027',
  onGenerateSuccess
}) {
  const [targetClass, setTargetClass] = useState(currentClass)
  const [overwrite, setOverwrite] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleRunGenerator = async () => {
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const res = await api.post('/timetable/auto-generate', {
        targetClass,
        academicYear,
        overwrite
      })

      if (res.success) {
        setResult(res.data)
        if (onGenerateSuccess) onGenerateSuccess()
      }
    } catch (err) {
      setError(err.message || 'Auto-generator algorithm encountered an error.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-brand-blue-600" />
            <div>
              <h3 className="text-base font-black text-slate-800">Auto Timetable Generator</h3>
              <p className="text-xs font-semibold text-slate-400">Constraint-based intelligent scheduler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-left">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 text-center">
              <Check className="h-8 w-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-black">Timetable Generated!</h4>
              <p className="text-xs font-semibold">
                Successfully scheduled {result.generatedCount} lectures for <strong>{result.targetClass}</strong> without conflicts.
              </p>
              <button
                onClick={() => { setResult(null); onClose(); }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                Close & View Grid
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Target Class *</label>
                <input
                  type="text"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded text-brand-blue-600 h-4 w-4"
                />
                <span>Overwrite existing schedule for this class</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunGenerator}
                  disabled={generating}
                  className="h-9 px-5 rounded-xl bg-brand-blue-600 text-white text-xs font-black hover:bg-brand-blue-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Run Auto Generator</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
