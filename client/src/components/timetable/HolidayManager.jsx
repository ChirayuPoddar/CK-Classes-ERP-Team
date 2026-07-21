import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Calendar, Award, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import api from '@/services/api'

export default function HolidayManager({ isOpen, onClose, onRefresh }) {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    date: '',
    endDate: '',
    type: 'School',
    description: '',
    academicYear: '2026-2027',
    isRecurring: false
  })

  const fetchHolidays = async () => {
    setLoading(true)
    try {
      const res = await api.get('/holidays')
      if (res.success) setHolidays(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchHolidays()
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Holiday name is required')
    if (!form.date) return setError('Date is required')

    try {
      await api.post('/holidays', form)
      fetchHolidays()
      if (onRefresh) onRefresh()
      setActiveTab('list')
      setForm({
        name: '',
        date: '',
        endDate: '',
        type: 'School',
        description: '',
        academicYear: '2026-2027',
        isRecurring: false
      })
    } catch (err) {
      setError(err.message || 'Failed to save holiday')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this holiday/event?')) return
    try {
      await api.delete(`/holidays/${id}`)
      fetchHolidays()
      if (onRefresh) onRefresh()
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
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
            <h3 className="text-base font-black text-slate-800">Holiday & Event Calendar</h3>
            <p className="text-xs font-semibold text-slate-400">Schedule institutional holidays, exam weeks, and sports days</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer",
              activeTab === 'list' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            All Holidays ({holidays.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1",
              activeTab === 'add' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Holiday / Event</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'list' ? (
            <div className="space-y-2.5">
              {holidays.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">No holidays or events configured.</div>
              ) : (
                holidays.map(h => (
                  <div key={h._id} className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{h.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black">{h.type}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                          {new Date(h.date).toLocaleDateString()} {h.endDate ? `– ${new Date(h.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => handleDelete(h._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Event / Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Mid-Term Exam Week"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-brand-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Category *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="National">National Holiday</option>
                    <option value="School">School Holiday</option>
                    <option value="Exam Week">Exam Week</option>
                    <option value="Sports Day">Sports Day</option>
                    <option value="Festival">Festival</option>
                    <option value="Event">Institutional Event</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Academic Year</label>
                  <select
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">End Date (Optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional details or instructions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-brand-blue-600 text-white text-xs font-black hover:bg-brand-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
