import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyReview } from '@/lib/anthropic'
import { z } from 'zod'

const schema = z.object({
  game_plan_id: z.string().uuid(),
  accomplishments: z.string().min(1),
  blockers: z.string().min(1),
  next_focus: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { game_plan_id, accomplishments, blockers, next_focus } = parsed.data

    // Rate limit: max 5 weekly reviews per user per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: reviewCount } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'weekly_review')
      .gte('sent_at', since)
    if ((reviewCount ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Fetch the game plan for context
    const { data: plan } = await supabase
      .from('game_plans')
      .select('goal_statement, ninety_day_target, result_kpis, activity_kpis, created_at')
      .eq('id', game_plan_id)
      .eq('user_id', user.id)
      .single()

    if (!plan) return NextResponse.json({ error: 'Game plan not found' }, { status: 404 })

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    const weekNumber = Math.min(13, Math.floor(daysSinceStart / 7) + 1)

    // Fetch latest KPI logs for context
    const { data: kpiLogs } = await supabase
      .from('kpi_logs')
      .select('kpi_name, value, logged_at')
      .eq('game_plan_id', game_plan_id)
      .order('logged_at', { ascending: false })
      .limit(50)

    const latestByKpi = (kpiLogs || []).reduce<Record<string, number>>((acc, log) => {
      if (!(log.kpi_name in acc)) acc[log.kpi_name] = Number(log.value)
      return acc
    }, {})

    // Generate Claude's coaching response
    const aiResponse = await generateWeeklyReview({
      goalStatement: plan.goal_statement,
      ninetyDayTarget: plan.ninety_day_target,
      weekNumber,
      resultKpis: plan.result_kpis as Array<{ name: string; target: string; current: string }>,
      activityKpis: plan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>,
      accomplishments,
      blockers,
      nextFocus: next_focus,
      latestKpiValues: latestByKpi,
    })

    // Save the check-in record
    const userResponseText = `Accomplishments: ${accomplishments}\n\nBlockers: ${blockers}\n\nNext week focus: ${next_focus}`

    const { error } = await supabase.from('check_ins').insert({
      user_id: user.id,
      game_plan_id,
      type: 'weekly_review',
      status: 'responded',
      ai_message: aiResponse,
      user_response: userResponseText,
      response_data: { accomplishments, blockers, next_focus },
      responded_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Weekly review insert error:', error)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ai_response: aiResponse })
  } catch (error) {
    console.error('Weekly review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
