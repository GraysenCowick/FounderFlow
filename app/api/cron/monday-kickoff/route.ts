import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildMondayKickoffEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function getWeekNumber(createdAt: string): number {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(13, Math.floor(days / 7) + 1)
}

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
    .select('id, user_id, goal_statement, ninety_day_target, weekly_schedule, created_at, profiles(full_name, email, notify_monday)')
    .eq('status', 'active')

  if (error) {
    console.error('Monday kickoff query error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let sent = 0
  const errors: string[] = []

  for (const plan of activePlans || []) {
    const profile = (Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles) as { full_name: string; email: string; notify_monday: boolean } | null
    if (!profile?.notify_monday) continue

    const weekNumber = getWeekNumber(plan.created_at)
    const message = `Your week ${weekNumber} game plan is ready. Stay focused on your 90-day target and hit every time block this week.`

    const emailData = buildMondayKickoffEmail({
      userName: profile.full_name,
      weekNumber,
      ninetyDayTarget: plan.ninety_day_target,
      weeklySchedule: (plan.weekly_schedule as Array<{ day: string; time_block: string; task: string; duration_minutes: number }>) || [],
      checkInPageUrl: `${APP_URL}/check-ins`,
    })

    try {
      await sendEmail({ ...emailData, to: profile.email })

      await supabase.from('check_ins').insert({
        user_id: plan.user_id,
        game_plan_id: plan.id,
        type: 'monday_kickoff',
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
