'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, ChevronUp, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardHeader } from '@/components/dashboard-header'
import { ResultKpiCard, ActivityKpiCard } from '@/components/kpi-card'
import { WeeklySchedule } from '@/components/weekly-schedule'

interface ScheduleItem {
  day: string
  time_block: string
  task: string
  duration_minutes: number
}
interface ResultKpi { name: string; target: string; current: string }
interface ActivityKpi { name: string; target: string; unit: string; frequency: string }

interface Plan {
  id: string
  goal_statement: string
  ninety_day_target: string
  result_kpis: ResultKpi[]
  activity_kpis: ActivityKpi[]
  weekly_schedule: ScheduleItem[]
  created_at: string
  start_date: string | null
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const DAY_COLORS: Record<string, string> = {
  Monday: 'text-blue-600 border-blue-500/30 bg-blue-50',
  Tuesday: 'text-purple-600 border-purple-500/30 bg-purple-50',
  Wednesday: 'text-violet-600 border-violet-500/30 bg-violet-50',
  Thursday: 'text-orange-600 border-orange-500/30 bg-orange-50',
  Friday: 'text-rose-600 border-rose-500/30 bg-rose-50',
  Saturday: 'text-pink-600 border-pink-500/30 bg-pink-50',
  Sunday: 'text-slate-600 border-slate-400/30 bg-slate-50',
}

export function PlanEditor({ plan: initialPlan }: { plan: Plan }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Plan>(initialPlan)
  const [saving, setSaving] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

  function enterEditMode() {
    setDraft({ ...initialPlan, result_kpis: [...initialPlan.result_kpis], activity_kpis: [...initialPlan.activity_kpis], weekly_schedule: [...initialPlan.weekly_schedule] })
    setCollapsedDays(new Set())
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
  }

  async function saveChanges() {
    setSaving(true)
    try {
      const res = await fetch(`/api/plan/${initialPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_statement: draft.goal_statement,
          ninety_day_target: draft.ninety_day_target,
          result_kpis: draft.result_kpis,
          activity_kpis: draft.activity_kpis,
          weekly_schedule: draft.weekly_schedule,
        }),
      })
      if (!res.ok) {
        toast.error('Something went wrong — try again.')
        return
      }
      setEditMode(false)
      toast.success('Plan updated!')
      router.refresh()
    } catch {
      toast.error('Something went wrong — try again.')
    } finally {
      setSaving(false)
    }
  }

  // --- Schedule helpers ---

  function updateScheduleItem(idx: number, field: keyof ScheduleItem, value: string | number) {
    setDraft(d => ({
      ...d,
      weekly_schedule: d.weekly_schedule.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }))
  }

  function deleteScheduleItem(idx: number) {
    setDraft(d => ({ ...d, weekly_schedule: d.weekly_schedule.filter((_, i) => i !== idx) }))
  }

  function addScheduleItem(day: string) {
    setDraft(d => {
      const schedule = [...d.weekly_schedule]
      let insertAt = schedule.length
      for (let i = schedule.length - 1; i >= 0; i--) {
        if (schedule[i].day === day) { insertAt = i + 1; break }
      }
      schedule.splice(insertAt, 0, { day, time_block: '', task: '', duration_minutes: 30 })
      return { ...d, weekly_schedule: schedule }
    })
  }

  function moveScheduleItem(idx: number, direction: 'up' | 'down') {
    setDraft(d => {
      const schedule = [...d.weekly_schedule]
      const day = schedule[idx].day
      const dayIndices = schedule.map((item, i) => item.day === day ? i : -1).filter(i => i !== -1)
      const posInDay = dayIndices.indexOf(idx)
      if (direction === 'up' && posInDay > 0) {
        const swapWith = dayIndices[posInDay - 1]
        ;[schedule[idx], schedule[swapWith]] = [schedule[swapWith], schedule[idx]]
        return { ...d, weekly_schedule: schedule }
      }
      if (direction === 'down' && posInDay < dayIndices.length - 1) {
        const swapWith = dayIndices[posInDay + 1]
        ;[schedule[idx], schedule[swapWith]] = [schedule[swapWith], schedule[idx]]
        return { ...d, weekly_schedule: schedule }
      }
      return d
    })
  }

  // --- KPI helpers ---

  function updateResultKpi(idx: number, field: keyof ResultKpi, value: string) {
    setDraft(d => ({
      ...d,
      result_kpis: d.result_kpis.map((k, i) => i === idx ? { ...k, [field]: value } : k),
    }))
  }

  function updateActivityKpi(idx: number, field: keyof ActivityKpi, value: string) {
    setDraft(d => ({
      ...d,
      activity_kpis: d.activity_kpis.map((k, i) => i === idx ? { ...k, [field]: value } : k),
    }))
  }

  // --- View mode ---

  if (!editMode) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <DashboardHeader
          goalStatement={initialPlan.goal_statement}
          ninetyDayTarget={initialPlan.ninety_day_target}
          createdAt={initialPlan.created_at}
        />
        <div className="flex justify-end">
          <Button variant="outline" onClick={enterEditMode}>Edit Plan</Button>
        </div>

        {initialPlan.result_kpis.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Result KPIs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialPlan.result_kpis.map((kpi, i) => (
                <ResultKpiCard key={i} kpi={kpi} gamePlanId={initialPlan.id} kpiIndex={i} />
              ))}
            </div>
          </section>
        )}

        {initialPlan.activity_kpis.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Activity KPIs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialPlan.activity_kpis.map((kpi, i) => (
                <ActivityKpiCard key={i} kpi={kpi} gamePlanId={initialPlan.id} kpiIndex={i} />
              ))}
            </div>
          </section>
        )}

        {initialPlan.weekly_schedule.length > 0 && (
          <WeeklySchedule
            schedule={initialPlan.weekly_schedule}
            startDate={initialPlan.start_date ?? undefined}
          />
        )}
      </div>
    )
  }

  // --- Edit mode ---

  const groupedByDay = ALL_DAYS.reduce<Record<string, { item: ScheduleItem; idx: number }[]>>((acc, day) => {
    const items = draft.weekly_schedule
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.day === day)
    if (items.length > 0) acc[day] = items
    return acc
  }, {})

  const saveCancel = (
    <div className="flex gap-2 justify-end">
      <Button variant="ghost" onClick={cancelEdit} disabled={saving}>Cancel</Button>
      <Button variant="default" onClick={saveChanges} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
      {saveCancel}

      {/* Goal & Target */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Goal &amp; 90-Day Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Goal Statement</label>
            <Textarea
              value={draft.goal_statement}
              onChange={e => setDraft(d => ({ ...d, goal_statement: e.target.value }))}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">90-Day Target</label>
            <Textarea
              value={draft.ninety_day_target}
              onChange={e => setDraft(d => ({ ...d, ninety_day_target: e.target.value }))}
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Result KPIs */}
      {draft.result_kpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Result KPIs</h2>
          <div className="space-y-3">
            {draft.result_kpis.map((kpi, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={kpi.name} onChange={e => updateResultKpi(i, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Target</label>
                    <Input value={kpi.target} onChange={e => updateResultKpi(i, 'target', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Current</label>
                    <Input value={kpi.current} onChange={e => updateResultKpi(i, 'current', e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Activity KPIs */}
      {draft.activity_kpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity KPIs</h2>
          <div className="space-y-3">
            {draft.activity_kpis.map((kpi, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={kpi.name} onChange={e => updateActivityKpi(i, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Target</label>
                    <Input value={kpi.target} onChange={e => updateActivityKpi(i, 'target', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Input value={kpi.unit} onChange={e => updateActivityKpi(i, 'unit', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Frequency</label>
                    <Input value={kpi.frequency} onChange={e => updateActivityKpi(i, 'frequency', e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Weekly Schedule */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ALL_DAYS.filter(day => groupedByDay[day]).map(day => {
              const items = groupedByDay[day]
              const isCollapsed = collapsedDays.has(day)

              const toggleCollapse = () => setCollapsedDays(prev => {
                const next = new Set(prev)
                if (next.has(day)) next.delete(day)
                else next.add(day)
                return next
              })

              return (
                <div key={day} className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${DAY_COLORS[day] || ''}`}
                    >
                      {day}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{items.length} task{items.length !== 1 ? 's' : ''}</span>
                      {isCollapsed
                        ? <ChevronRight className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />
                      }
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-3 space-y-2">
                      {items.map(({ item, idx }) => {
                        const posInDay = items.findIndex(x => x.idx === idx)
                        const isFirst = posInDay === 0
                        const isLast = posInDay === items.length - 1

                        return (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border/60">
                            <div className="flex-1 space-y-2">
                              <Textarea
                                value={item.task}
                                onChange={e => updateScheduleItem(idx, 'task', e.target.value)}
                                rows={2}
                                className="resize-none text-sm"
                                placeholder="Task description"
                              />
                              <div className="flex flex-wrap gap-2 items-center">
                                <Input
                                  value={item.time_block}
                                  onChange={e => updateScheduleItem(idx, 'time_block', e.target.value)}
                                  className="h-8 text-xs w-40"
                                  placeholder="9:00 AM – 10:00 AM"
                                />
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={item.duration_minutes}
                                    onChange={e => updateScheduleItem(idx, 'duration_minutes', Math.max(1, parseInt(e.target.value) || 30))}
                                    className="h-8 text-xs w-20"
                                    min={1}
                                    max={480}
                                  />
                                  <span className="text-xs text-muted-foreground">min</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
                              <button
                                type="button"
                                onClick={() => moveScheduleItem(idx, 'up')}
                                disabled={isFirst}
                                title="Move up"
                                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveScheduleItem(idx, 'down')}
                                disabled={isLast}
                                title="Move down"
                                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteScheduleItem(idx)}
                                title="Delete task"
                                className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        onClick={() => addScheduleItem(day)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-muted/50 w-full mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add task
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {saveCancel}
    </div>
  )
}
