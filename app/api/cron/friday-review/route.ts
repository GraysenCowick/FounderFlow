import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildFridayReviewEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
    .select('id, user_id, result_kpis, created_at, profiles(full_name, email, notify_friday)')
    .eq('status', 'active')

  if (error) {
    console.error('Friday review query error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let sent = 0
  const errors: string[] = []

  for (const plan of activePlans || []) {
    const profile = (Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles) as { full_name: string; email: string; notify_friday: boolean } | null
    if (!profile?.notify_friday) continue

    const weekNumber = Math.min(13, Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
    const message = `Week ${weekNumber} is done. Time for your Friday Review. Log your KPI numbers, reflect on what worked and what didn't, and set yourself up for a strong week ${weekNumber + 1}.`

    const emailData = buildFridayReviewEmail({
      userName: profile.full_name,
      weekNumber,
      resultKpis: (plan.result_kpis as Array<{ name: string; target: string; current: string }>) || [],
      checkInPageUrl: `${APP_URL}/check-ins`,
    })

    try {
      await sendEmail({ ...emailData, to: profile.email })

      await supabase.from('check_ins').insert({
        user_id: plan.user_id,
        game_plan_id: plan.id,
        type: 'friday_review',
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
