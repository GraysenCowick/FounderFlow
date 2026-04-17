import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanEditor } from '@/components/plan-editor'

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

  return (
    <PlanEditor
      plan={{
        id: plan.id,
        goal_statement: plan.goal_statement,
        ninety_day_target: plan.ninety_day_target,
        result_kpis: (plan.result_kpis as Array<{ name: string; target: string; current: string }>) || [],
        activity_kpis: (plan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>) || [],
        weekly_schedule: (plan.weekly_schedule as Array<{ day: string; time_block: string; task: string; duration_minutes: number }>) || [],
        created_at: plan.created_at,
        start_date: plan.start_date ?? null,
      }}
    />
  )
}
