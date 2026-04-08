import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard-header'
import { ResultKpiCard, ActivityKpiCard } from '@/components/kpi-card'
import { WeeklySchedule } from '@/components/weekly-schedule'

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plan } = await supabase
    .from('game_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!plan) notFound()

  const resultKpis = (plan.result_kpis as Array<{ name: string; target: string; current: string }>) || []
  const activityKpis = (plan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>) || []
  const weeklySchedule = (plan.weekly_schedule as Array<{ day: string; time_block: string; task: string; duration_minutes: number }>) || []

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
      <DashboardHeader
        goalStatement={plan.goal_statement}
        ninetyDayTarget={plan.ninety_day_target}
        createdAt={plan.created_at}
      />

      {resultKpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Result KPIs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resultKpis.map((kpi, i) => <ResultKpiCard key={i} kpi={kpi} gamePlanId={id} kpiIndex={i} />)}
          </div>
        </section>
      )}

      {activityKpis.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity KPIs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityKpis.map((kpi, i) => <ActivityKpiCard key={i} kpi={kpi} gamePlanId={id} kpiIndex={i} />)}
          </div>
        </section>
      )}

      {weeklySchedule.length > 0 && <WeeklySchedule schedule={weeklySchedule} />}
    </div>
  )
}
