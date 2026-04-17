import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planEditSchema } from '@/lib/validators/plan'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = planEditSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { goal_statement, ninety_day_target, result_kpis, activity_kpis, weekly_schedule } = parsed.data

    // Verify ownership — RLS (game_plans_update policy) also enforces this server-side
    const { data: plan } = await supabase
      .from('game_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const { error } = await supabase
      .from('game_plans')
      .update({ goal_statement, ninety_day_target, result_kpis, activity_kpis, weekly_schedule })
      .eq('id', planId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Plan update error:', error)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
