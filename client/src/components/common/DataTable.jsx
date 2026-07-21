import React from 'react'
import { ChevronLeft, ChevronRight, Filter, MoreVertical } from 'lucide-react'
import { cn } from '@/utils/cn'

export const TableHeadSort = ({ title, sortField, currentSortField, sortOrder, onClick }) => {
  const isActive = currentSortField === sortField
  const isAsc = isActive && sortOrder === 'asc'
  const isDesc = isActive && sortOrder === 'desc'

  return (
    <span 
      onClick={onClick} 
      className="cursor-pointer hover:text-slate-800 transition-colors select-none inline-flex items-center gap-1.5 py-4"
    >
      <span>{title}</span>
      <span className="w-4 h-4 relative inline-flex items-center justify-center shrink-0 select-none">
        <span className={cn(
          "absolute inset-0 flex items-center justify-center text-slate-400 font-extrabold font-mono text-[12px] transition-opacity duration-150",
          isAsc ? "opacity-100" : "opacity-0"
        )}>
          ↑
        </span>
        <span className={cn(
          "absolute inset-0 flex items-center justify-center text-slate-400 font-extrabold font-mono text-[12px] transition-opacity duration-150",
          isDesc ? "opacity-100" : "opacity-0"
        )}>
          ↓
        </span>
      </span>
    </span>
  )
}

export const TableHeaderFilter = ({ 
  type, 
  title, 
  activeFilter, 
  isOpen, 
  onToggle, 
  onClose, 
  onSelect, 
  options = [] 
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 justify-start relative">
      {title}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0",
          activeFilter && "text-brand-blue-500 bg-blue-50"
        )}
      >
        <Filter className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent cursor-default"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 normal-case font-bold text-slate-600 text-left">
            {type === 'examDate' ? (
              <div className="p-3 flex flex-col gap-2.5 text-[11px] w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase">Select Date</span>
                  <input
                    type="date"
                    value={activeFilter || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(''); onClose(); }}
                    className="text-[10px] font-black text-red-500 hover:underline uppercase cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="text-[10px] font-black text-slate-500 hover:underline uppercase cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 text-[11px]">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onSelect(''); 
                    onClose(); 
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer",
                    !activeFilter && "bg-slate-100 text-slate-800 font-extrabold"
                  )}
                >
                  {type === 'subject' || type === 'subjectId' ? 'All Subjects' : type === 'class' ? 'All Classes' : 'All Statuses'}
                </button>
                {options.map(item => {
                  const itemId = typeof item === 'object' ? item._id : item
                  const itemName = typeof item === 'object' ? item.name : item
                  const isSelected = activeFilter === itemId

                  return (
                    <button
                      key={itemId}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(itemId)
                        onClose()
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer",
                        isSelected && "bg-blue-50 text-brand-blue-600 font-extrabold"
                      )}
                    >
                      {itemName}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export const TablePagination = ({ page, totalPages, total, onPrev, onNext }) => {
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none flex-none">
      <span className="text-[11px] text-slate-400 font-black">
        Page {page} of {totalPages} (Total: {total})
      </span>
      <div className="flex gap-2">
        <button 
          disabled={page === 1}
          onClick={onPrev}
          className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-55 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>
        <button 
          disabled={page === totalPages}
          onClick={onNext}
          className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-55 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export const TableRowActions = React.memo(({ actions }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const buttonRefs = React.useRef([])

  // Filter invisible actions
  const visibleActions = (actions || []).filter(act => act.visible !== false)

  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isOpen])

  React.useEffect(() => {
    if (isOpen && buttonRefs.current[0]) {
      // Focus first item on open
      buttonRefs.current[0].focus()
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    const items = buttonRefs.current.filter(Boolean)
    if (items.length === 0) return

    const currentIndex = items.indexOf(document.activeElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % items.length
      items[nextIndex].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + items.length) % items.length
      items[prevIndex].focus()
    }
  }

  if (visibleActions.length === 0) return null

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(prev => !prev)
        }}
        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer select-none border border-transparent hover:border-slate-200/50 active:scale-95 shrink-0"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200/60 rounded-2xl shadow-xl p-1.5 z-40 origin-top-right transform transition-all animate-in fade-in scale-in zoom-in-95 duration-100 normal-case text-[11px] text-slate-700 font-bold select-none text-left"
          role="menu"
          onKeyDown={handleKeyDown}
        >
          {visibleActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                ref={el => buttonRefs.current[idx] = el}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (action.disabled) return
                  action.callback()
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-[11px] outline-none focus:bg-slate-50",
                  action.danger 
                    ? "text-red-650 hover:bg-red-50 focus:bg-red-50" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-55 focus:bg-slate-50"
                )}
                role="menuitem"
              >
                {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", action.danger ? "text-red-500" : "text-slate-400")} />}
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})

