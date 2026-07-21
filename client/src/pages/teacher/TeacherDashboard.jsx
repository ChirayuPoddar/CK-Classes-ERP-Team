import React from 'react'

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Teacher Hub</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Homework trackers, submissions, class schedules, and attendance marking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-[var(--border-light)] rounded-premium-lg shadow-premium-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Assigned Batches</span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">4 Batches</h3>
        </div>
        <div className="p-6 bg-white border border-[var(--border-light)] rounded-premium-lg shadow-premium-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Pending Gradings</span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">12 Items</h3>
        </div>
      </div>
    </div>
  )
}
