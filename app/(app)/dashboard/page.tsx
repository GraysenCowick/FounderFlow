import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard-header'
import { ResultKpiCard, ActivityKpiCard } from '@/components/kpi-card'
import { WeeklySchedule } from '@/components/weekly-schedule'
import { TodayFocus } from '@/components/today-focus'

const btnPrimary = 'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors whitespace-nowrap shadow-sm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gamePlan } = await supabase
    .from('game_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!gamePlan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-2xl font-bold mb-3">No game plan yet</h2>
          <p className="text-muted-foreground mb-8">
            Answer a few quick questions and let AI build your personalized 90-day plan with weekly time blocks and KPIs.
          </p>
          <Link href="/onboarding" className={btnPrimary}>
            Build my game plan →
          </Link>
        </div>
      </div>
    )
  }

  // Fetch latest KPI log value per KPI name
  const { data: kpiLogs } = await supabase
    .from('kpi_logs')
    .select('kpi_name, value')
    .eq('user_id', user.id)
    .eq('game_plan_id', gamePlan.id)
    .order('logged_at', { ascending: false })

  // Reduce to latest value per kpi_name (already ordered desc, first hit wins)
  const latestByKpi = (kpiLogs || []).reduce<Record<string, number>>((acc, log) => {
    if (!(log.kpi_name in acc)) acc[log.kpi_name] = Number(log.value)
    return acc
  }, {})

  const resultKpis = (gamePlan.result_kpis as Array<{ name: string; target: string; current: string }>) || []
  const activityKpis = (gamePlan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>) || []
  const weeklySchedule = (gamePlan.weekly_schedule as Array<{ day: string; time_block: string; task: string; duration_minutes: number }>) || []

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
      <DashboardHeader
        goalStatement={gamePlan.goal_statement}
        ninetyDayTarget={gamePlan.ninety_day_target}
        createdAt={gamePlan.created_at}
      />

      {/* Today's Focus */}
      {weeklySchedule.length > 0 && (
        <TodayFocus schedule={weeklySchedule} />
      )}

      {/* Result KPIs */}
      {resultKpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Result KPIs — Outcomes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resultKpis.map((kpi, i) => (
              <ResultKpiCard
                key={i}
                kpi={kpi}
                gamePlanId={gamePlan.id}
                kpiIndex={i}
                loggedValue={latestByKpi[kpi.name] ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Activity KPIs */}
      {activityKpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity KPIs — Inputs You Control
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityKpis.map((kpi, i) => (
              <ActivityKpiCard
                key={i}
                kpi={kpi}
                gamePlanId={gamePlan.id}
                kpiIndex={i}
                loggedValue={latestByKpi[kpi.name] ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weekly Schedule */}
      {weeklySchedule.length > 0 && (
        <WeeklySchedule schedule={weeklySchedule} />
      )}
    </div>
  )
}
