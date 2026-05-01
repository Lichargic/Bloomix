import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../lib/theme'
import type { Category } from '../lib/theme'
import { useCreateScheduledTask } from '../hooks/useScheduledTasks'
import { useProfile } from '../hooks/useProfile'
import { buildScheduledDueAt, resolveTimezone } from '../lib/scheduledDates'

interface Props {
  defaultDate: string // YYYY-MM-DD
  onClose: () => void
}

export function ScheduledTaskModal({ defaultDate, onClose }: Props) {
  const createTask = useCreateScheduledTask()
  const { data: profile } = useProfile()
  const firstRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate)
  const [allDay, setAllDay] = useState(true)
  const [dueTime, setDueTime] = useState('09:00')
  const [category, setCategory] = useState<Category>('routines')
  const [notes, setNotes] = useState('')

  useEffect(() => { firstRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const due_at = buildScheduledDueAt(dueDate, dueTime, allDay, resolveTimezone(profile?.timezone))
    createTask.mutate({
      title: title.trim(),
      due_at,
      all_day: allDay,
      category,
      notes: notes.trim() || null,
      recurrence: 'none',
    }, { onSuccess: onClose })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add event or deadline">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span>Add event or deadline</span>
            <span className="head-subtitle" style={{ display: 'block' }}>One-time · tied to a specific date</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">Title</span>
            <input
              ref={firstRef}
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Essay draft due"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Date</span>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
            />
          </label>

          <label className="form-field form-field-row">
            <input
              type="checkbox"
              checked={allDay}
              onChange={e => setAllDay(e.target.checked)}
            />
            <span className="form-label">All day</span>
          </label>

          {!allDay && (
            <label className="form-field">
              <span className="form-label">Time</span>
              <input
                className="form-input"
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
              />
            </label>
          )}

          <label className="form-field">
            <span className="form-label">Category</span>
            <select
              className="form-input"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">Notes (optional)</span>
            <input
              className="form-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any details…"
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? 'Saving…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
