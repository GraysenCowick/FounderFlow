import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildMidweekPulseEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = request.headers.get('x-cron-secret') ||
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null) ||
    new URL(request.url).searchParams.get('secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: activePlans, error } = await supabase
    .from('game_plans')
    .select('id, user_id, activity_kpis, created_at, profiles(full_name, email, notify_midweek)')
    .eq('status', 'active')

  if (error) {
    console.error('Midweek pulse query error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let sent = 0
  const errors: string[] = []

  for (const plan of activePlans || []) {
    const profile = (Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles) as { full_name: string; email: string; notify_midweek: boolean } | null
    if (!profile?.notify_midweek) continue

    const message = `It's Wednesday — midweek check-in time. How many of your activity KPIs have you hit so far this week? Log your progress and stay on track.`

    const emailData = buildMidweekPulseEmail({
      userName: profile.full_name,
      weekNumber: Math.min(13, Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1),
      activityKpis: (plan.activity_kpis as Array<{ name: string; target: string; unit: string; frequency: string }>) || [],
      checkInPageUrl: `${APP_URL}/check-ins`,
    })

    try {
      await sendEmail({ ...emailData, to: profile.email })

      await supabase.from('check_ins').insert({
        user_id: plan.user_id,
        game_plan_id: plan.id,
        type: 'midweek_pulse',
        status: 'pending',
        ai_message: message,
      })

      sent++
    } catch (err) {
      errors.push(`${profile.email}: ${String(err)}`)
    }
  }

  return NextResponse.json({ sent, errors })
}
