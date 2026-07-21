import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Error = ({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred while processing your request.', 
  onRetry 
}) => {
  return (
    <div className="w-full min-h-[300px] flex items-center justify-center p-6">
      <div className="max-w-[400px] text-center flex flex-col items-center gap-4">
        {/* Error icon frame */}
        <div className="h-12 w-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center text-[var(--danger-solid)]">
          <AlertCircle className="h-6 w-6" />
        </div>
        
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{message}</p>
        </div>

        {onRetry && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRetry} 
            className="mt-2 flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Request
          </Button>
        )}
      </div>
    </div>
  )
}
