import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, PieChart, Users, Building, Calendar, Layers, RefreshCw } from 'lucide-react'
import api from '@/services/api'

export default function TimetableAnalytics({ academicYear = '2026-2027' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get('/timetable/analytics', { params: { academicYear } })
      if (res.success) setData(res.data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [academicYear])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 flex items-center justify-center gap-3 text-slate-400 text-xs font-bold">
        <RefreshCw className="h-4 w-4 animate-spin text-brand-blue-500" />
        <span>Loading analytics dashboard...</span>
      </div>
    )
  }

  if (!data) return null

  const maxWorkload = Math.max(...(data.teacherWorkload?.map(t => t.count) || [1]), 1)
  const maxRoom = Math.max(...(data.roomUtilization?.map(r => r.count) || [1]), 1)

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart2 className="h-4.5 w-4.5 text-brand-blue-600" />
            <span>Timetable Analytics & Utilization</span>
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Live metrics on instructor workload, classroom occupancy, and subject balance</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="h-8 w-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teacher Workload Card */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Teacher Workload Distribution</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {data.teacherWorkload?.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No assigned lectures</span>
            ) : (
              data.teacherWorkload?.map(t => (
                <div key={t.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span className="truncate pr-2">{t.name}</span>
                    <span className="shrink-0">{t.count} lectures</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(t.count / maxWorkload) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Room Occupancy Card */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700">
            <Building className="h-4 w-4 text-purple-500" />
            <span>Classroom Utilization</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {data.roomUtilization?.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No room assignments</span>
            ) : (
              data.roomUtilization?.map(r => (
                <div key={r.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span className="truncate pr-2">{r.name}</span>
                    <span className="shrink-0">{r.count} slots</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(r.count / maxRoom) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Day Balance */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Weekly Day Balance</span>
          </div>

          <div className="space-y-2">
            {Object.entries(data.dayDistribution || {}).map(([day, count]) => (
              <div key={day} className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>{day}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                  {count} lectures
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
