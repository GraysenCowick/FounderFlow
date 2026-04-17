'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScheduleItem {
  day: string
  time_block: string
  task: string
  duration_minutes: number
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_COLORS: Record<string, string> = {
  Monday: 'text-blue-600 border-blue-500/30 bg-blue-50',
  Tuesday: 'text-purple-600 border-purple-500/30 bg-purple-50',
  Wednesday: 'text-violet-600 border-violet-500/30 bg-violet-50',
  Thursday: 'text-orange-600 border-orange-500/30 bg-orange-50',
  Friday: 'text-rose-600 border-rose-500/30 bg-rose-50',
  Saturday: 'text-pink-600 border-pink-500/30 bg-pink-50',
  Sunday: 'text-slate-600 border-slate-400/30 bg-slate-50',
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getTodayStorageKey() {
  return `todayFocus-${new Date().toISOString().slice(0, 10)}`
}

function readChecked(): Record<number, boolean> {
  try {
    const stored = localStorage.getItem(getTodayStorageKey())
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function WeeklySchedule({
  schedule,
  startDate,
}: {
  schedule: ScheduleItem[]
  startDate?: string
}) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayIndex = ALL_DAYS.indexOf(today)
  const DAY_ORDER = todayIndex === -1
    ? ALL_DAYS
    : [...ALL_DAYS.slice(todayIndex), ...ALL_DAYS.slice(0, todayIndex)]

  const grouped = DAY_ORDER.reduce<Record<string, ScheduleItem[]>>((acc, day) => {
    const items = schedule.filter((s) => s.day === day)
    if (items.length > 0) acc[day] = items
    return acc
  }, {})

  // todayItems in the same order TodayFocus uses, so indices match
  const todayItems = schedule.filter((s) => s.day === today)

  const [checked, setChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setChecked(readChecked())

    const handler = (e: Event) => {
      setChecked((e as CustomEvent<Record<number, boolean>>).detail)
    }
    window.addEventListener('todayFocusUpdated', handler)
    return () => window.removeEventListener('todayFocusUpdated', handler)
  }, [])

  // Compute actual calendar date for each day of the week starting from today
  const todayDateOnly = new Date()
  todayDateOnly.setHours(0, 0, 0, 0)
  const DAY_DATES: Record<string, Date> = {}
  ALL_DAYS.forEach((day, i) => {
    const offset = todayIndex === -1 ? i : (i - todayIndex + 7) % 7
    const d = new Date(todayDateOnly)
    d.setDate(d.getDate() + offset)
    DAY_DATES[day] = d
  })

  // Compute current week number and date range from startDate
  let weekLabel: string | null = null
  if (startDate) {
    const startDateObj = parseDateLocal(startDate)
    const msSinceStart = todayDateOnly.getTime() - startDateObj.getTime()
    const daysSinceStart = Math.floor(msSinceStart / (24 * 60 * 60 * 1000))
    const weekNum = Math.min(13, Math.max(1, Math.floor(daysSinceStart / 7) + 1))
    const weekStart = new Date(startDateObj)
    weekStart.setDate(startDateObj.getDate() + (weekNum - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekLabel = `Week ${weekNum} of 13 · ${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Weekly Schedule</CardTitle>
        {weekLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{weekLabel}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2.5">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${DAY_COLORS[day] || 'text-muted-foreground'} ${day === today ? 'ring-1 ring-violet-600 ring-offset-1' : ''}`}
                >
                  {day}
                  {day === today && <span className="ml-1.5 font-semibold">· Today</span>}
                  {DAY_DATES[day] && (
                    <span className="ml-1.5 font-normal opacity-70">· {formatShortDate(DAY_DATES[day])}</span>
                  )}
                </Badge>
              </div>
              <div className="space-y-2 ml-2">
                {items.map((item, i) => {
                  const todayIdx = day === today ? todayItems.findIndex((t) => t.task === item.task && t.time_block === item.time_block) : -1
                  const isDone = todayIdx !== -1 && checked[todayIdx]
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isDone
                          ? 'bg-muted/20 border-border/40 opacity-60'
                          : 'bg-muted/40 border-border/60'
                      }`}
                    >
                      <div className="flex-shrink-0 text-xs text-muted-foreground mt-0.5 w-28">{item.time_block}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug transition-colors ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.task}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.duration_minutes} min</p>
                      </div>
                      {isDone && (
                        <div className="flex-shrink-0 mt-0.5">
                          <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 text-violet-600">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
