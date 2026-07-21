import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function SearchableSelect({
  options = [], // Array of { value, label, searchText, ... }
  value = '',
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  error = false,
  className = '',
  renderOption = null // Custom render function (opt, isSelected) => ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt => {
    const query = searchQuery.toLowerCase()
    return (
      (opt.label || '').toLowerCase().includes(query) ||
      (opt.searchText || '').toLowerCase().includes(query)
    )
  })

  const handleSelect = (val) => {
    onChange(val)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 flex items-center justify-between cursor-pointer transition-all",
          isOpen && "border-blue-500 bg-white",
          error ? "border-red-500" : "border-slate-200/85",
          disabled && "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200/50 pointer-events-none"
        )}
      >
        <span className={cn("truncate pr-2 text-left", !selectedOption && "text-slate-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-250 shrink-0", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] z-[100] max-h-64 overflow-hidden flex flex-col">
          {/* Search Input bar */}
          <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none placeholder-slate-400 py-1"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-slate-150 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* List options */}
          <div className="overflow-y-auto flex-1 py-1 divide-y divide-slate-55">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "cursor-pointer transition-colors text-left",
                      isSelected ? "bg-blue-50/30 text-brand-blue-700" : "hover:bg-slate-50"
                    )}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="px-4 py-2.5 text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span className="truncate pr-2">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-brand-blue-600 shrink-0" />}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-4 text-center text-xs font-bold text-slate-400">
                No matching results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
