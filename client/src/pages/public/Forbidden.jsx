import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Forbidden() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-secondary)] px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-5 bg-white p-8 rounded-premium-xl border border-[var(--border-light)] shadow-premium-2">
        <div className="h-12 w-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center text-[var(--danger-solid)]">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Access Denied</h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Your current account credentials do not authorize access to this specific dashboard directory. 
          </p>
        </div>

        <Link to="/dashboard" className="w-full">
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
