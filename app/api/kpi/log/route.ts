import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  game_plan_id: z.string().uuid(),
  kpi_name: z.string().min(1),
  kpi_type: z.enum(['result', 'activity']),
  value: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { game_plan_id, kpi_name, kpi_type, value } = parsed.data

    // Rate limit: max 100 KPI logs per user per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: logCount } = await supabase
      .from('kpi_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('logged_at', since)
    if ((logCount ?? 0) >= 100) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 100 KPI logs per day.' },
        { status: 429 }
      )
    }

    // Verify the game plan belongs to this user
    const { data: plan } = await supabase
      .from('game_plans')
      .select('id')
      .eq('id', game_plan_id)
      .eq('user_id', user.id)
      .single()

    if (!plan) return NextResponse.json({ error: 'Game plan not found' }, { status: 404 })

    const { error } = await supabase.from('kpi_logs').insert({
      user_id: user.id,
      game_plan_id,
      kpi_name,
      kpi_type,
      value,
    })

    if (error) {
      console.error('KPI log error:', error)
      return NextResponse.json({ error: 'Failed to log KPI' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KPI log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
