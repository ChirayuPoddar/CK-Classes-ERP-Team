import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Unauthorized() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-secondary)] px-6">
      <div className="max-w-md text-center flex flex-col items-center gap-5 bg-white p-8 rounded-premium-xl border border-[var(--border-light)] shadow-premium-2">
        <div className="h-12 w-12 rounded-full bg-[var(--warning-bg)] flex items-center justify-center text-[var(--warning-solid)]">
          <Lock className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Authentication Required</h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            You must be signed in to access this portal section. If you had a session active, it may have expired.
          </p>
        </div>

        <Link to="/auth/login" className="w-full">
          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
            Go to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
