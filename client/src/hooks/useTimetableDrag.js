import { useState, useCallback, useRef, useEffect } from 'react'
import api from '@/services/api'

const getId = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val._id) return String(val._id)
  return String(val)
}

export default function useTimetableDrag({
  timetableSlots = [],
  allSlots = [],
  periods = [],
  holidays = [],
  teachers = [],
  currentClass = 'Class 1',
  academicYear = '2026-2027',
  onSlotsChange,
  onSubjectsRefresh,
  showToast
}) {
  const [dragItem, setDragItem] = useState(null)
  const [hoverCell, setHoverCell] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)


  // Global drag ref for cross-event data access
  const dragStoreRef = useRef(null)
  const slotsRef = useRef(timetableSlots)

  // Sync ref with latest timetableSlots prop
  useEffect(() => {
    slotsRef.current = timetableSlots
  }, [timetableSlots])

  // Validate real-time drop condition
  const validateDrop = useCallback((item, day, periodObj, targetSlot) => {
    if (!item || !periodObj) return { isValid: false, reason: 'Invalid drag payload' }

    // 1. Lunch / Break Period Check
    if (periodObj.type === 'lunch' || periodObj.type === 'short_break' || periodObj.type === 'break') {
      return { isValid: false, reason: `Cannot schedule during ${periodObj.name}` }
    }

    // 2. Holiday Check
    const holidayMatch = holidays.find(h => h.day === day || h.applicableDays?.includes(day))
    if (holidayMatch) {
      return { isValid: false, reason: `Holiday: ${holidayMatch.name || 'School Closed'}` }
    }

    const payload = item.data || {}
    const subject = item.type === 'subject' ? payload : payload.subject
    const teacherId = item.type === 'subject' 
      ? getId(payload.assignedTeacher)
      : getId(payload.teacher)
    const roomId = item.type === 'subject' ? payload.preferredRoom : payload.room

    // 3. Teacher Availability & Double Booking Check across ALL classes
    if (teacherId) {
      const teacherObj = teachers.find(t => getId(t) === teacherId)
      const teacherName = teacherObj ? `${teacherObj.firstName || ''} ${teacherObj.lastName || ''}`.trim() : 'Teacher'

      const teacherConflict = allSlots.find(s => {
        const pId = getId(s.period)
        const tId = getId(s.teacher)
        // Exclude current slot if moving within grid
        if (item.type === 'slot' && getId(s) === getId(item.id)) return false
        return s.day === day && pId === getId(periodObj) && tId === teacherId
      })

      if (teacherConflict) {
        return {
          isValid: false,
          reason: `Teacher ${teacherName} is already teaching ${teacherConflict.class || 'another class'} in this period.`
        }
      }
    }

    // 4. Room Conflict Check
    if (roomId) {
      const roomConflict = allSlots.find(s => {
        const pId = s.period?._id || s.period
        if (item.type === 'slot' && s._id === item.id) return false
        return s.day === day && pId === periodObj._id && s.room === roomId
      })

      if (roomConflict) {
        return {
          isValid: false,
          reason: `Room ${roomId} is already occupied by ${roomConflict.class || 'another class'}.`
        }
      }
    }

    // 5. Consecutive Periods Check (for Labs)
    const consecutive = subject?.consecutivePeriods || (subject?.lectureType === 'Lab' ? 2 : 1)
    if (consecutive > 1) {
      const sortedPeriods = periods.filter(p => p.type === 'period').sort((a, b) => a.order - b.order)
      const currentIdx = sortedPeriods.findIndex(p => p._id === periodObj._id)
      if (currentIdx === -1 || currentIdx + consecutive > sortedPeriods.length) {
        return { isValid: false, reason: `Requires ${consecutive} consecutive periods, but grid boundary reached.` }
      }
    }

    return { isValid: true, reason: '' }
  }, [allSlots, periods, holidays, teachers])

  // Drag Start Handlers
  const handleDragStartSubject = useCallback((e, subject) => {
    const item = { type: 'subject', id: subject._id, data: subject }
    console.log('[DnD Lifecycle] 1. Drag Start (Subject Pool)', subject._id, subject.name)
    dragStoreRef.current = item
    window.__TT_DRAG_STORE__ = item
    setDragItem(item)

    try {
      e.dataTransfer.setData('text/plain', `subject:${subject._id}`)
      e.dataTransfer.effectAllowed = 'copy'
    } catch (err) {}
  }, [])

  const handleDragStartSlot = useCallback((e, slot) => {
    console.log("HOOK dragStart")
    if (!slot) return
    console.log('[DnD Lifecycle] 1. Drag Start (Scheduled Slot)', slot._id, slot.subject?.name, 'From:', slot.day)
    const item = { type: 'slot', id: getId(slot), data: slot }
    dragStoreRef.current = item
    window.__TT_DRAG_STORE__ = item
    setDragItem(item)

    try {
      e.dataTransfer.setData('text/plain', `slot:${getId(slot)}`)
      e.dataTransfer.effectAllowed = 'move'
    } catch (err) {}
  }, [])

  // Drag Over & Hover Cell Handlers
  const handleDragOverCell = useCallback((e, day, periodObj, targetSlot) => {
    console.log("HOOK dragOver")
    e.preventDefault()
    e.stopPropagation()

    const item = dragStoreRef.current || window.__TT_DRAG_STORE__ || dragItem

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = item?.type === 'slot' ? 'move' : 'copy'
    }

    if (!item) return

    const validation = validateDrop(item, day, periodObj, targetSlot)

    setHoverCell({
      day,
      periodId: periodObj._id,
      isValid: validation.isValid,
      reason: validation.reason,
      isOccupied: !!targetSlot
    })
  }, [dragItem, validateDrop])

  const handleDragLeaveCell = useCallback(() => {
    setHoverCell(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    console.log('[DnD Lifecycle] Drag End Cleanup (Delayed)')
    setTimeout(() => {
      dragStoreRef.current = null
      window.__TT_DRAG_STORE__ = null
      setDragItem(null)
      setHoverCell(null)
    }, 200)
  }, [])

  // Execute Drop Action with Optimistic Local State & Persistence
  const executeDrop = useCallback(async (e, day, periodObj, targetSlot, isCopyMode = false) => {
    console.log("HOOK executeDrop")
    e.preventDefault()
    e.stopPropagation()

    const item = dragStoreRef.current || window.__TT_DRAG_STORE__ || dragItem

    if (!item) {
      console.warn('[DnD Lifecycle] Drop Cancelled: No drag payload found')
      setHoverCell(null)
      return
    }

    console.log('[DnD Lifecycle] 3. Drop Event Triggered', { item, targetDay: day, targetPeriod: periodObj.name, targetSlot })

    // Immediately clear hover highlight
    setHoverCell(null)

    // 1. Validation
    const validation = validateDrop(item, day, periodObj, targetSlot)
    console.log('[DnD Lifecycle] 4. Drop Validation Result:', validation)

    if (!validation.isValid) {
      showToast('error', `🚫 Cannot Schedule: ${validation.reason}`)
      return
    }

    setIsProcessing(true)
    const snapshot = [...slotsRef.current]

    // 2. OPTION A: Drop Subject from Unscheduled Pool
    if (item.type === 'subject') {
      const sub = item.data
      const teacherId = sub.assignedTeacher || null
      const roomId = sub.preferredRoom || ''

      if (targetSlot && targetSlot._id) {
        try {
          await api.delete(`/timetable/${targetSlot._id}`)
        } catch (err) {
          console.warn('Clearing target slot prior to drop failed:', err.message)
        }
      }

      const slotPayload = {
        class: currentClass,
        day,
        period: getId(periodObj),
        subject: getId(sub),
        teacher: teacherId ? getId(teacherId) : null,
        room: roomId,
        academicYear,
        lectureType: sub.lectureType || 'Theory',
        credits: sub.credits || 0,
        remarks: sub.notes || ''
      }

      // Optimistic Local Update
      const tempId = `temp_${Date.now()}`
      const optimisticSlot = {
        _id: tempId,
        ...slotPayload,
        period: periodObj,
        subject: sub,
        teacher: teachers.find(t => getId(t) === getId(teacherId)) || null
      }

      console.log('[DnD Lifecycle] 5. Optimistic State Update (Pool Add)')
      const newSlots = [...slotsRef.current.filter(s => targetSlot ? getId(s) !== getId(targetSlot) : true), optimisticSlot]
      onSlotsChange(newSlots)

      try {
        console.log('[DnD Lifecycle] 6. Backend Persistence Request (POST /timetable)')
        const res = await api.post('/timetable', slotPayload)
        
        if (res && res.data) {
          const createdSlot = res.data.data || res.data
          console.log('[DnD Lifecycle] 7. Backend Response Success', createdSlot._id)
          const mergedSlots = slotsRef.current.map(s => s._id === tempId ? createdSlot : s)
          onSlotsChange(mergedSlots)


        }

        showToast('success', `Scheduled ${sub.name} on ${day}, ${periodObj.name}`)
        onSubjectsRefresh()
      } catch (err) {
        console.error('[DnD Lifecycle] Backend Save Error - Rolling back:', err)
        onSlotsChange(snapshot)
        showToast('error', `Save Failed: ${err.message || 'Server error while persisting slot'}`)
      } finally {
        setIsProcessing(false)
        dragStoreRef.current = null
        window.__TT_DRAG_STORE__ = null
        setDragItem(null)
      }
      return
    }

    // 3. OPTION B: Move or Swap existing slot in Grid
    if (item.type === 'slot') {
      const slotToMove = item.data
      if (!slotToMove) return

      console.log('[DnD Lifecycle] Moving Slot:', getId(slotToMove), 'From:', slotToMove.day, 'To:', day, periodObj.name)

      // Same cell drop
      if (!isCopyMode && slotToMove.day === day && getId(slotToMove.period) === getId(periodObj)) {
        console.log('[DnD Lifecycle] Dropped on same cell - No action')
        setIsProcessing(false)
        return
      }

      // Swap handling
      if (targetSlot && targetSlot._id && getId(targetSlot) !== getId(slotToMove)) {
        try {
          console.log('[DnD Lifecycle] 5. Optimistic State Update (Swap)', getId(slotToMove), 'with', getId(targetSlot))
          const swappedSlots = slotsRef.current.map(s => {
            if (getId(s) === getId(slotToMove)) return { ...s, day, period: periodObj }
            if (getId(s) === getId(targetSlot)) return { ...s, day: slotToMove.day, period: slotToMove.period }
            return s
          })
          onSlotsChange(swappedSlots)

          console.log('[DnD Lifecycle] 6. Backend Persistence Request (POST /timetable/swap)')
          await api.post('/timetable/swap', {
            slot1Id: getId(slotToMove),
            slot2Id: getId(targetSlot)
          })


          showToast('success', `Swapped lectures on ${day}`)
          onSubjectsRefresh()
        } catch (err) {
          console.error('[DnD Lifecycle] Swap Persistence Error - Rolling back:', err)
          onSlotsChange(snapshot)
          showToast('error', `Swap Failed: ${err.message}`)
        } finally {
          setIsProcessing(false)
          dragStoreRef.current = null
          window.__TT_DRAG_STORE__ = null
          setDragItem(null)
        }
        return
      }

      // Move handling
      try {
        console.log('[DnD Lifecycle] 5. Optimistic State Update (Move Slot)', getId(slotToMove), 'to Day:', day, 'Period:', periodObj.name)
        const targetPeriodId = getId(periodObj)
        
        // Create completely NEW array with updated slot
        const movedSlots = slotsRef.current.map(s => {
          if (getId(s) === getId(slotToMove)) {
            return {
              ...s,
              day,
              period: periodObj
            }
          }
          return s
        })

        // Immediate React State Update
        onSlotsChange(movedSlots)

        console.log('[DnD Lifecycle] 6. Backend Persistence Request (PUT /timetable/' + getId(slotToMove) + ')')
        const res = await api.put(`/timetable/${getId(slotToMove)}`, {
          day,
          period: targetPeriodId
        })

        if (res && res.data) {
          const updatedSlot = res.data.data || res.data
          console.log('[DnD Lifecycle] Update Success:', updatedSlot)
          const mergedSlots = slotsRef.current.map(s => getId(s) === getId(updatedSlot) ? updatedSlot : s)
          onSlotsChange(mergedSlots)
        }


        console.log('[DnD Lifecycle] 7. Move Persisted Successfully')
        showToast('success', `Moved lecture to ${day}, ${periodObj.name}`)
        onSubjectsRefresh()
      } catch (err) {
        console.error('[DnD Lifecycle] Move Persistence Error - Rolling back:', err)
        onSlotsChange(snapshot)
        showToast('error', `Move Failed: ${err.message}`)
      } finally {
        setIsProcessing(false)
        dragStoreRef.current = null
        window.__TT_DRAG_STORE__ = null
        setDragItem(null)
      }
    }
  }, [dragItem, validateDrop, currentClass, academicYear, teachers, onSlotsChange, onSubjectsRefresh, showToast])

  return {
    dragItem,
    hoverCell,
    isProcessing,
    handleDragStartSubject,
    handleDragStartSlot,
    handleDragOverCell,
    handleDragLeaveCell,
    handleDragEnd,
    executeDrop
  }
}
