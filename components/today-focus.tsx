'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScheduleItem {
  day: string
  time_block: string
  task: string
  duration_minutes: number
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function TodayFocus({ schedule }: { schedule: ScheduleItem[] }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayItems = schedule.filter((s) => s.day === today)
  const storageKey = `todayFocus-${getTodayKey()}`

  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setChecked(JSON.parse(stored))
    } catch {}
    setMounted(true)
  }, [storageKey])

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = { ...prev, [index]: !prev[index] }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('todayFocusUpdated', { detail: next }))
      } catch {}
      return next
    })
  }

  if (todayItems.length === 0) return null

  const doneCount = Object.values(checked).filter(Boolean).length

  return (
    <Card className="border-violet-200 bg-violet-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Today&apos;s Focus
            <span className="text-xs font-normal text-muted-foreground">{today}</span>
          </CardTitle>
          {mounted && (
            <span className="text-xs text-muted-foreground">
              {doneCount}/{todayItems.length} done
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {todayItems.map((item, i) => {
            const isDone = mounted && checked[i]
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border border-violet-200/70 bg-white hover:bg-violet-50 transition-colors text-left group shadow-sm"
              >
                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 transition-colors ${
                  isDone
                    ? 'bg-violet-600 border-violet-600'
                    : 'border-border group-hover:border-violet-400'
                }`}>
                  {isDone && (
                    <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug transition-colors ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.task}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.time_block} · {item.duration_minutes} min
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
