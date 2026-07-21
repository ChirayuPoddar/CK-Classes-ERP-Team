import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Calendar, User, MapPin, BookOpen } from 'lucide-react'

export default function SearchCommandPalette({
  isOpen,
  onClose,
  teachers = [],
  subjects = [],
  rooms = [],
  classes = [],
  onSelectResult
}) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const q = query.toLowerCase().trim()

  const matchedClasses = classes.filter(c => c.toLowerCase().includes(q))
  const matchedTeachers = teachers.filter(t => `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase().includes(q))
  const matchedSubjects = subjects.filter(s => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)))
  const matchedRooms = rooms.filter(r => r.name.toLowerCase().includes(q))

  const totalMatches = matchedClasses.length + matchedTeachers.length + matchedSubjects.length + matchedRooms.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh]"
      >
        {/* Search input bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="h-4 w-4 text-brand-blue-600 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search class, teacher, subject, room... (Cmd+K)"
            className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-left">
          {!q ? (
            <div className="text-center py-10 text-xs font-bold text-slate-400">
              Type to search across all classes, faculty, rooms, and subjects...
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-10 text-xs font-bold text-slate-400">
              No matching results found for "{query}".
            </div>
          ) : (
            <>
              {matchedClasses.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classes</span>
                  {matchedClasses.map(c => (
                    <div
                      key={c}
                      onClick={() => { onSelectResult('class', c); onClose(); }}
                      className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>{c}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Switch Class</span>
                    </div>
                  ))}
                </div>
              )}

              {matchedTeachers.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teachers</span>
                  {matchedTeachers.map(t => (
                    <div
                      key={t._id}
                      onClick={() => { onSelectResult('teacher', t._id); onClose(); }}
                      className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <span>{`${t.firstName || ''} ${t.lastName || ''}`.trim()}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Filter Teacher</span>
                    </div>
                  ))}
                </div>
              )}

              {matchedSubjects.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subjects</span>
                  {matchedSubjects.map(s => (
                    <div
                      key={s._id}
                      onClick={() => { onSelectResult('subject', s._id); onClose(); }}
                      className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{s.name} ({s.code})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Filter Subject</span>
                    </div>
                  ))}
                </div>
              )}

              {matchedRooms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classrooms</span>
                  {matchedRooms.map(r => (
                    <div
                      key={r._id || r.name}
                      onClick={() => { onSelectResult('room', r.name); onClose(); }}
                      className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        <span>{r.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Filter Room</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
