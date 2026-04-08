import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  game_plan_id: z.string().uuid(),
  kpi_type: z.enum(['result', 'activity']),
  kpi_index: z.number().int().min(0),
  name: z.string().min(1).max(200).optional(),
  target: z.string().min(1).max(100).optional(),
  unit: z.string().max(50).optional(),
  frequency: z.string().max(100).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { game_plan_id, kpi_type, kpi_index, name, target, unit, frequency } = parsed.data

    // Fetch plan — RLS ensures it belongs to this user
    const { data: plan } = await supabase
      .from('game_plans')
      .select('result_kpis, activity_kpis')
      .eq('id', game_plan_id)
      .eq('user_id', user.id)
      .single()

    if (!plan) return NextResponse.json({ error: 'Game plan not found' }, { status: 404 })

    if (kpi_type === 'result') {
      const kpis = plan.result_kpis as Array<{ name: string; target: string; current: string }>
      if (kpi_index >= kpis.length) {
        return NextResponse.json({ error: 'KPI index out of range' }, { status: 400 })
      }
      if (name !== undefined) kpis[kpi_index].name = name
      if (target !== undefined) kpis[kpi_index].target = target

      const { error } = await supabase
        .from('game_plans')
        .update({ result_kpis: kpis })
        .eq('id', game_plan_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('KPI edit error:', error)
        return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 })
      }
    } else {
      const kpis = plan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>
      if (kpi_index >= kpis.length) {
        return NextResponse.json({ error: 'KPI index out of range' }, { status: 400 })
      }
      if (name !== undefined) kpis[kpi_index].name = name
      if (target !== undefined) kpis[kpi_index].target = target
      if (unit !== undefined) kpis[kpi_index].unit = unit
      if (frequency !== undefined) kpis[kpi_index].frequency = frequency

      const { error } = await supabase
        .from('game_plans')
        .update({ activity_kpis: kpis })
        .eq('id', game_plan_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('KPI edit error:', error)
        return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KPI edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
