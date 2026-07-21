import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Edit3, MapPin, Building, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import api from '@/services/api'

export default function RoomManager({ isOpen, onClose, onRefresh }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [editingRoom, setEditingRoom] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    capacity: 40,
    building: 'Main Block',
    floor: '1st Floor',
    type: 'Classroom',
    facilities: { projector: false, ac: false, smartBoard: false, computerLab: false },
    status: 'Active'
  })

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rooms')
      if (res.success) setRooms(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchRooms()
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Room name is required')

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, form)
      } else {
        await api.post('/rooms', form)
      }
      fetchRooms()
      if (onRefresh) onRefresh()
      setActiveTab('list')
      setEditingRoom(null)
      setForm({
        name: '',
        capacity: 40,
        building: 'Main Block',
        floor: '1st Floor',
        type: 'Classroom',
        facilities: { projector: false, ac: false, smartBoard: false, computerLab: false },
        status: 'Active'
      })
    } catch (err) {
      setError(err.message || 'Failed to save room')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return
    try {
      await api.delete(`/rooms/${id}`)
      fetchRooms()
      if (onRefresh) onRefresh()
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const startEdit = (room) => {
    setEditingRoom(room)
    setForm({
      name: room.name,
      capacity: room.capacity || 40,
      building: room.building || '',
      floor: room.floor || '',
      type: room.type || 'Classroom',
      facilities: room.facilities || { projector: false, ac: false, smartBoard: false, computerLab: false },
      status: room.status || 'Active'
    })
    setActiveTab('add')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-800">Classroom & Lab Management</h3>
            <p className="text-xs font-semibold text-slate-400">Configure rooms, capacity limits, buildings, and smart facilities</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('list'); setEditingRoom(null); }}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer",
              activeTab === 'list' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            onClick={() => {
              setEditingRoom(null)
              setForm({
                name: '',
                capacity: 40,
                building: 'Main Block',
                floor: '1st Floor',
                type: 'Classroom',
                facilities: { projector: false, ac: false, smartBoard: false, computerLab: false },
                status: 'Active'
              })
              setActiveTab('add')
            }}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1",
              activeTab === 'add' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{editingRoom ? 'Edit Room' : 'Add New Room'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-bold">No rooms created yet.</div>
              ) : (
                rooms.map(r => (
                  <div key={r._id} className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white hover:shadow-xs transition-all space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">{r.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue-600 text-[10px] font-black">{r.type}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" />
                          <span>{r.building || 'Main Block'} • {r.floor || 'Ground'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Capacity: <strong className="text-slate-800">{r.capacity} seats</strong></span>
                      <div className="flex items-center gap-1 text-[10px]">
                        {r.facilities?.projector && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Projector</span>}
                        {r.facilities?.ac && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">AC</span>}
                        {r.facilities?.smartBoard && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Smart Board</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Room Name / Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 101, Physics Lab"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-brand-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Seating Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 40 })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-brand-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Room Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Lab">Lab</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Smart Classroom">Smart Classroom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Building</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Block"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Floor"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Facilities Checkboxes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Facilities Available</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { key: 'projector', label: 'Projector' },
                    { key: 'ac', label: 'Air Conditioned' },
                    { key: 'smartBoard', label: 'Smart Board' },
                    { key: 'computerLab', label: 'Computers' }
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
                      <input
                        type="checkbox"
                        checked={!!form.facilities?.[f.key]}
                        onChange={(e) => setForm({
                          ...form,
                          facilities: { ...form.facilities, [f.key]: e.target.checked }
                        })}
                        className="rounded text-brand-blue-600 focus:ring-brand-blue-500 h-4 w-4"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-brand-blue-600 text-white text-xs font-black hover:bg-brand-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  {editingRoom ? 'Update Room' : 'Save Room'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
