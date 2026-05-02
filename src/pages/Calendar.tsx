import { useRef, useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMonthPips } from '../hooks/useMonthPips'
import { useScheduledTasksForMonth, useToggleScheduledTask, useDeleteScheduledTask } from '../hooks/useScheduledTasks'
import { currentDailyDay } from '../lib/dates'
import { resolveTimezone, scheduledLocalDate } from '../lib/scheduledDates'
import { getCategoryConfig } from '../lib/theme'
import type { Category } from '../lib/theme'
import { Topbar } from '../components/Topbar'
import { useScrollFade } from '../hooks/useScrollFade'
import { sortByCompletionThenAlpha } from '../lib/sort'
import { ScheduledTaskModal } from '../components/ScheduledTaskModal'
import {
  CALENDAR_EMPTY_STATES,
  formatCalendarEventTime,
  formatUpcomingEventWhen,
  getCalendarDayEmptyState,
} from '../lib/pageModels/calendarModel'

// ─── Param validators ─────────────────────────────────────────────────────────

function isDateParam(value?: string): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
}

function isMonthParam(value?: string): value is string {
  return /^\d{4}-\d{2}$/.test(value ?? '')
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

interface CalCell {
  day: number
  dateStr: string // 'YYYY-MM-DD' or '' for muted
  muted: boolean
}

function buildGrid(year: number, month0: number): CalCell[] {
  // month0 is 0-indexed (Jan = 0)
  const first = new Date(year, month0, 1)
  const last  = new Date(year, month0 + 1, 0)
  const cells: CalCell[] = []

  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month0, -first.getDay() + i + 1)
    cells.push({ day: d.getDate(), dateStr: '', muted: true })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr, muted: false })
  }
  while (cells.length < 42) {
    cells.push({ day: cells.length - first.getDay() - last.getDate() + 1, dateStr: '', muted: true })
  }
  return cells
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function Calendar() {
  useDocumentTitle('Calendar')
  const navigate = useNavigate()
  const { date: dateParam } = useParams() as { date?: string }
  const { data: profile } = useProfile()
  const timezone = resolveTimezone(profile?.timezone)

  const today = currentDailyDay(timezone)

  const month = useMemo(() => {
    if (isDateParam(dateParam)) return dateParam.slice(0, 7)
    if (isMonthParam(dateParam)) return dateParam
    return today.slice(0, 7)
  }, [dateParam, today])

  const selectedDay = isDateParam(dateParam) ? dateParam : null

  const [y, m0] = useMemo(() => {
    const parts = month.split('-').map(Number)
    return [parts[0], parts[1] - 1] as [number, number]
  }, [month])

  const cells = useMemo(() => buildGrid(y, m0), [y, m0])

  const { data: pips } = useMonthPips(month)
  const { data: scheduledTasks = [] } = useScheduledTasksForMonth(month)
  const toggleScheduled = useToggleScheduledTask()
  const deleteScheduled = useDeleteScheduledTask()

  const [modalOpen, setModalOpen] = useState(false)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const railElementRef = useRef<HTMLDivElement | null>(null)
  const railFadeRef = useScrollFade<HTMLDivElement>('horizontal')
  const dayDetailRef = useScrollFade<HTMLDivElement>()

  // Calendar should never sit in an unselected "Select a day" state.
  // /calendar defaults to today; /calendar/YYYY-MM defaults to that month's first day.
  useEffect(() => {
    if (selectedDay) return

    const defaultDay = isMonthParam(dateParam)
      ? `${month}-01`
      : today

    navigate(`/calendar/${defaultDay}`, { replace: true })
  }, [dateParam, month, navigate, selectedDay, today])

  function setRailRef(el: HTMLDivElement | null) {
    railElementRef.current = el
    railFadeRef(el)
  }

  useEffect(() => {
    const rail = railElementRef.current
    if (!rail) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) return // let native horizontal scroll through
      e.preventDefault()
      rail.scrollLeft += e.deltaY
    }
    rail.addEventListener('wheel', onWheel, { passive: false })
    return () => rail.removeEventListener('wheel', onWheel)
  }, [])

  const monthName = new Date(y, m0, 1).toLocaleString('en', { month: 'long' }).toUpperCase()

  function dateInTargetMonth(targetYear: number, targetMonth0: number) {
    const sourceDay = selectedDay
      ? Number(selectedDay.slice(8, 10))
      : 1

    const lastDay = new Date(targetYear, targetMonth0 + 1, 0).getDate()
    const day = Math.min(sourceDay, lastDay)

    return `${targetYear}-${String(targetMonth0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    const targetYear = m0 === 0 ? y - 1 : y
    const targetMonth0 = m0 === 0 ? 11 : m0 - 1
    navigate(`/calendar/${dateInTargetMonth(targetYear, targetMonth0)}`)
  }

  function nextMonth() {
    const targetYear = m0 === 11 ? y + 1 : y
    const targetMonth0 = m0 === 11 ? 0 : m0 + 1
    navigate(`/calendar/${dateInTargetMonth(targetYear, targetMonth0)}`)
  }

  function selectDay(dateStr: string) {
    navigate(`/calendar/${dateStr}`)
  }

  function handleGridKey(e: React.KeyboardEvent) {
    if (e.key === 't') {
      navigate(`/calendar/${today}`)
      return
    }
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const d = delta[e.key]
    if (d === undefined) return
    e.preventDefault()
    const cur = cellRefs.current.findIndex(el => el === document.activeElement)
    if (cur === -1) return
    let nxt = cur + d
    if (Math.abs(d) === 1) {
      while (nxt >= 0 && nxt < cells.length && cells[nxt]?.muted) nxt += d
    }
    if (nxt >= 0 && nxt < cells.length && !cells[nxt]?.muted) {
      cellRefs.current[nxt]?.focus()
      selectDay(cells[nxt].dateStr)
    }
  }

  function handleCellKey(e: React.KeyboardEvent, dateStr: string) {
    if (e.key === 'Enter') { selectDay(dateStr); return }
    if (e.key === 'n') { selectDay(dateStr); setModalOpen(true); return }
    if (e.key === 'N') { selectDay(dateStr); setModalOpen(true); return }
  }

  // ─── Day detail data ─────────────────────────────────────────────────────────
  const selectedScheduled = useMemo(
    () => sortByCompletionThenAlpha(
      scheduledTasks.filter(t => scheduledLocalDate(t.due_at, timezone) === selectedDay),
      t => t.title
    ),
    [scheduledTasks, selectedDay, timezone]
  )

  const upcomingTasks = useMemo(
    () => scheduledTasks.filter(t => scheduledLocalDate(t.due_at, timezone) >= today),
    [scheduledTasks, today, timezone]
  )

  const isPast   = !!selectedDay && selectedDay < today
  const hasPastBloom = isPast && !!pips?.get(selectedDay)?.bloom
  const dayEmptyState = getCalendarDayEmptyState({
    selectedDay,
    scheduledCount: selectedScheduled.length,
    hasPastBloom,
  })

  const selectedLabel = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Select a day'

  const hasSelInView  = cells.some(c => !c.muted && c.dateStr === selectedDay)
  const firstNonMuted = cells.findIndex(c => !c.muted)

  function cellTabIndex(isSelected: boolean, cellIndex: number) {
    if (isSelected) return 0
    if (!hasSelInView && cellIndex === firstNonMuted) return 0
    return -1
  }

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas cal-canvas fade-in" data-screen-label="Calendar">
        <h1 className="sr-only">Calendar</h1>
        <div className="cal-grid-wrap">

          {/* ─── Month grid ──────────────────────────────────────────────── */}
          <div className="calendar-shell month-shell">
            <div className="cal-head">
              <button className="nav-btn" onClick={prevMonth} aria-label="Previous month">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M12 5L7 10L12 15" />
                </svg>
              </button>
              <span>{monthName} {y}</span>
              <button className="nav-btn" onClick={nextMonth} aria-label="Next month">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M8 5L13 10L8 15" />
                </svg>
              </button>
            </div>

            <div className="cal-dows" aria-hidden="true">
              {DOWS.map((d, i) => (
                <span key={i} className="dow">{d}</span>
              ))}
            </div>

            <div className="cal-grid" onKeyDown={handleGridKey} role="grid" aria-label={`${monthName} ${y}`}>
              {cells.map((c, i) => {
                if (c.muted) {
                  return <span key={i} className="day muted" aria-hidden="true">{c.day}</span>
                }
                const pip = pips?.get(c.dateStr)
                const isSelected = c.dateStr === selectedDay
                const isT = c.dateStr === today

                return (
                  <button
                    key={i}
                    ref={el => { cellRefs.current[i] = el }}
                    tabIndex={cellTabIndex(isSelected, i)}
                    role="gridcell"
                    aria-selected={isSelected}
                    className={`day ${isT ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectDay(c.dateStr)}
                    onKeyDown={e => handleCellKey(e, c.dateStr)}
                    aria-label={`${c.day}${pip?.bloom ? ', bloomed' : ''}${pip?.deadline ? ', has events' : ''}`}
                  >
                    {c.day}
                    {pip?.bloom    && <span className="pip bloom" />}
                    {pip?.deadline && <span className="pip deadline" />}
                  </button>
                )
              })}
            </div>

            <div className="legend" aria-label="Legend">
              <span><span className="leg-dot bloom" /> bloom</span>
              <span><span className="leg-dot deadline" /> event</span>
            </div>
          </div>

          {/* ─── Day detail ──────────────────────────────────────────────── */}
          <div className="calendar-shell day-detail" aria-label="Day detail">
            <div className="cal-head">
              <span>{selectedLabel}</span>
            </div>

            <div className="scroll-fade-v day-detail-scroll-wrap calendar-events-fade">
            <div className="day-detail-body" ref={dayDetailRef}>
              {selectedDay && dayEmptyState && (
                <div className="calendar-empty">
                  <span className="calendar-empty-icon" aria-hidden="true">{dayEmptyState.icon}</span>
                  <h3>{dayEmptyState.title}</h3>
                  <p>{dayEmptyState.body}</p>
                  {selectedDay && 'actionLabel' in dayEmptyState && (
                    <button
                      className="add-task-btn"
                      onClick={() => setModalOpen(true)}
                    >
                      <span className="add-icon" aria-hidden="true">+</span>
                      <span>{dayEmptyState.actionLabel}</span>
                    </button>
                  )}
                </div>
              )}

              {selectedDay && (
                <>

                {/* Past bloom history */}
                {hasPastBloom && (
                  <div className="day-stats">
                    <div className="stat">
                      <span className="pip bloom" style={{ display: 'inline-block', position: 'relative', marginRight: 4 }} />
                      <span>Tree bloomed</span>
                    </div>
                  </div>
                )}

                {/* Scheduled tasks */}
                {selectedScheduled.length > 0 && (
                  <ul className="task-list calendar-event-list" role="list" aria-label="Events and deadlines for selected day">
                    {selectedScheduled.map(t => {
                      const cat = getCategoryConfig(t.category as Category)
                      const isDone = t.completed_at !== null
                      const timeStr = formatCalendarEventTime(t.due_at, t.all_day, timezone)
                      return (
                        <li key={t.id} className={`task calendar-event ${isDone ? 'is-done' : ''}`}>
                          <button
                            className="task-check"
                            onClick={() => toggleScheduled.mutate({ id: t.id, complete: !isDone })}
                            aria-label={isDone ? `Mark "${t.title}" undone` : `Mark "${t.title}" done`}
                            aria-pressed={isDone}
                          >
                            {isDone && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                <polyline points="5,12 10,17 19,7" />
                              </svg>
                            )}
                          </button>
                          <span className="calendar-event-main">
                            <span className="task-text event-title">{t.title}</span>
                            <span className="event-meta-row">
                              <span className="event-time-pill">{timeStr}</span>
                              <span className="task-cat" style={{ '--cat': cat.color } as React.CSSProperties}>
                                <span className="cat-dot" aria-hidden="true" />
                                <span className="task-cat-label">{cat.label}</span>
                              </span>
                            </span>
                          </span>
                          <button
                            className="task-delete"
                            onClick={() => deleteScheduled.mutate(t.id)}
                            aria-label={`Delete "${t.title}"`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <line x1="6" y1="6" x2="18" y2="18" />
                              <line x1="18" y1="6" x2="6" y2="18" />
                            </svg>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}

                </>
              )}
            </div>
            </div>{/* end day-detail-scroll-wrap */}
            {selectedDay && !dayEmptyState && (
              <button
                className="add-task-btn day-detail-add"
                onClick={() => setModalOpen(true)}
              >
                <span className="add-icon" aria-hidden="true">+</span>
                <span>Add event / deadline</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Upcoming rail ────────────────────────────────────────────────── */}
        <div className="cal-upcoming">
          <h2 className="section-h">UPCOMING THIS MONTH</h2>
          <div className="scroll-fade-h">
          <div className="upcoming-rail" ref={setRailRef}>
            {upcomingTasks.length === 0 && (
              <div className="upcoming-empty">
                <span className="calendar-empty-icon" aria-hidden="true">{CALENDAR_EMPTY_STATES.quietMonth.icon}</span>
                <div>
                  <b>{CALENDAR_EMPTY_STATES.quietMonth.title}</b>
                  <p>{CALENDAR_EMPTY_STATES.quietMonth.body}</p>
                </div>
              </div>
            )}
            {upcomingTasks.map(t => {
              const cat = getCategoryConfig(t.category as Category)
              const dateLabel = formatUpcomingEventWhen(t.due_at, t.all_day, timezone)
              return (
                <div key={t.id} className="up-card">
                  <span className="up-when">{dateLabel}</span>
                  <span className="up-label">{t.title}</span>
                  <span className="up-cat" style={{ background: cat.color + '44', color: cat.color }}>
                    {cat.label}
                  </span>
                </div>
              )
            })}
          </div>
          </div>{/* end scroll-fade-h */}
        </div>
      </main>

      {modalOpen && selectedDay && (
        <ScheduledTaskModal
          defaultDate={selectedDay}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
