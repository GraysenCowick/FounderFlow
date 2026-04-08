import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateGamePlan } from '@/lib/anthropic'
import { questionnaireSchema } from '@/lib/validators/questionnaire'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = questionnaireSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Rate limit: max 3 plan generations per user per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('questionnaires')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)
    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can generate up to 3 plans per day. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Ensure profile exists (may have been missed during signup)
    const serviceClient = await createServiceClient()
    await serviceClient.from('profiles').upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? 'Unknown',
      email: user.email ?? '',
    }, { onConflict: 'id', ignoreDuplicates: true })

    // Save questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert({
        user_id: user.id,
        business_description: data.business_description,
        big_goal: data.big_goal,
        current_state: data.current_state,
        hours_per_week: data.hours_per_week,
        obstacles: data.obstacles,
        content_platforms: data.focus_areas,
        additional_context: data.additional_context || null,
      })
      .select()
      .single()

    if (qError) {
      console.error('Questionnaire insert error:', qError)
      return NextResponse.json({ error: 'Failed to save questionnaire' }, { status: 500 })
    }

    // Generate game plan via Claude
    const { parsed: gamePlan, raw } = await generateGamePlan(data)

    // Save game plan
    const { data: savedPlan, error: planError } = await supabase
      .from('game_plans')
      .insert({
        user_id: user.id,
        questionnaire_id: questionnaire.id,
        goal_statement: gamePlan.goal_statement,
        ninety_day_target: gamePlan.ninety_day_target,
        result_kpis: gamePlan.result_kpis,
        activity_kpis: gamePlan.activity_kpis,
        weekly_schedule: gamePlan.weekly_schedule,
        raw_ai_response: raw,
        status: 'active',
      })
      .select()
      .single()

    if (planError) {
      console.error('Game plan insert error:', planError)
      return NextResponse.json({ error: 'Failed to save game plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, plan_id: savedPlan.id })
  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
