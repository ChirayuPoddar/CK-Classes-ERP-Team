import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Clock, Coffee, Utensils, MoveUp, MoveDown, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import api from '@/services/api'

export default function PeriodManager({ isOpen, onClose, periods = [], onRefresh }) {
  const [periodList, setPeriodList] = useState(periods)
  const [activeTab, setActiveTab] = useState('list') // 'list' or 'add'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // New period form
  const [name, setName] = useState('')
  const [type, setType] = useState('period') // 'period', 'break', 'lunch', 'short_break'
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [templateName, setTemplateName] = useState('Default')

  React.useEffect(() => {
    setPeriodList(periods)
  }, [periods])

  if (!isOpen) return null

  const handleSavePeriod = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!startTime || !endTime) return setError('Start and end times are required')

    setSubmitting(true)
    try {
      const res = await api.post('/periods', {
        name: name.trim(),
        type,
        startTime,
        endTime,
        templateName
      })
      if (res.success) {
        onRefresh()
        setActiveTab('list')
        setName('')
        setStartTime('')
        setEndTime('')
      }
    } catch (err) {
      setError(err.message || 'Failed to create period')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? Deleting a period will remove lectures scheduled in it.')) return
    setSubmitting(true)
    try {
      await api.delete(`/periods/${id}`)
      onRefresh()
    } catch (err) {
      alert(err.message || 'Failed to delete period')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMove = async (index, direction) => {
    const newList = [...periodList]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= newList.length) return

    const temp = newList[index]
    newList[index] = newList[targetIdx]
    newList[targetIdx] = temp

    setPeriodList(newList)
    const orderedIds = newList.map(p => p._id)
    try {
      await api.post('/periods/reorder', { orderedIds })
      onRefresh()
    } catch (err) {
      console.error('Reorder error:', err)
    }
  }

  const getTypeIcon = (pType) => {
    if (pType === 'lunch') return <Utensils className="h-3.5 w-3.5 text-amber-500" />
    if (pType === 'short_break' || pType === 'break') return <Coffee className="h-3.5 w-3.5 text-purple-500" />
    return <Clock className="h-3.5 w-3.5 text-brand-blue-500" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-800">Period & Break Configuration</h3>
            <p className="text-xs font-semibold text-slate-400">Configure lecture slots, lunch breaks, and timing templates</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer",
              activeTab === 'list'
                ? "border-brand-blue-600 text-brand-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            All Periods ({periodList.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1",
              activeTab === 'add'
                ? "border-brand-blue-600 text-brand-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Period</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'list' ? (
            <div className="space-y-2">
              {periodList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">No periods configured yet.</div>
              ) : (
                periodList.map((p, idx) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {getTypeIcon(p.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{p.name}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            p.type === 'lunch' && "bg-amber-100 text-amber-700",
                            p.type === 'short_break' && "bg-purple-100 text-purple-700",
                            p.type === 'break' && "bg-slate-100 text-slate-600",
                            p.type === 'period' && "bg-blue-100 text-blue-700"
                          )}>
                            {p.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">
                          {p.startTime} – {p.endTime} {p.duration ? `(${p.duration} mins)` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        disabled={idx === periodList.length - 1}
                        onClick={() => handleMove(idx, 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                        title="Delete Period"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSavePeriod} className="space-y-4 text-left">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Period Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Period 1, Lunch Break"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue-500 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Period Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue-500 bg-slate-50"
                  >
                    <option value="period">Lecture Period</option>
                    <option value="lunch">Lunch Break</option>
                    <option value="short_break">Short Break</option>
                    <option value="break">Generic Break</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Template *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Default, Half Day"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 rounded-xl bg-brand-blue-600 text-white text-xs font-black hover:bg-brand-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save Period
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
