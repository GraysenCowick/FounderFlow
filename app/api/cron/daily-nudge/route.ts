import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildDailyNudgeEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ||
    new URL(request.url).searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: activePlans, error } = await supabase
    .from('game_plans')
    .select('id, user_id, weekly_schedule, profiles(full_name, email, notify_daily)')
    .eq('status', 'active')

  if (error) {
    console.error('Daily nudge query error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const todayName = DAYS[new Date().getDay()]
  let sent = 0
  const errors: string[] = []

  for (const plan of activePlans || []) {
    const profile = (Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles) as { full_name: string; email: string; notify_daily: boolean } | null
    if (!profile?.notify_daily) continue

    const schedule = (plan.weekly_schedule as Array<{ day: string; time_block: string; task: string; duration_minutes: number }>) || []
    const todayTask = schedule.find((s) => s.day === todayName) || null

    const message = todayTask
      ? `Today's task: ${todayTask.task} (${todayTask.time_block}, ${todayTask.duration_minutes} min). Did you get it done?`
      : `No specific task scheduled for today — use this time for a weekly review or deep work on your goal.`

    const emailData = buildDailyNudgeEmail({
      userName: profile.full_name,
      todayTask,
      checkInPageUrl: `${APP_URL}/check-ins`,
    })

    try {
      await sendEmail({ ...emailData, to: profile.email })

      await supabase.from('check_ins').insert({
        user_id: plan.user_id,
        game_plan_id: plan.id,
        type: 'daily_nudge',
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
