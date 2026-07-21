import React from 'react'

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Student Desk</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Homework records, schedules, attendances, and study library.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-[var(--border-light)] rounded-premium-lg shadow-premium-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Attendance Percentage</span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">94.8%</h3>
        </div>
        <div className="p-6 bg-white border border-[var(--border-light)] rounded-premium-lg shadow-premium-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Homework Done</span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">18 / 20</h3>
        </div>
        <div className="p-6 bg-white border border-[var(--border-light)] rounded-premium-lg shadow-premium-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Outstanding Fees</span>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">₹0.00</h3>
        </div>
      </div>
    </div>
  )
}
