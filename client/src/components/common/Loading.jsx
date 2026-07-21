import React from 'react'

export const Loading = ({ fullPage = false, message = 'Loading details...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Premium Apple-style loading ring */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-4 border-brand-blue-50 opacity-20" />
        <div className="absolute inset-0 rounded-full border-4 border-brand-blue-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">{message}</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-secondary)] w-screen h-screen">
        {content}
      </div>
    )
  }

  return (
    <div className="w-full min-h-[200px] flex items-center justify-center">
      {content}
    </div>
  )
}
