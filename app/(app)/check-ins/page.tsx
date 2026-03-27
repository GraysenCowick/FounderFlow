import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckInCard } from '@/components/check-in-card'
import { WeeklyReviewForm } from '@/components/weekly-review-form'

const btnPrimary = 'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors whitespace-nowrap shadow-sm'

export default async function CheckInsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: checkIns }, { data: activePlan }] = await Promise.all([
    supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50),
    supabase
      .from('game_plans')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ])

  const pending = checkIns?.filter((c) => c.status === 'pending') || []
  const past = checkIns?.filter((c) => c.status !== 'pending') || []

  const weekNumber = activePlan
    ? Math.min(13, Math.floor((Date.now() - new Date(activePlan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
    : 1

  return (
    <div className="flex-1 p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Check-ins</h1>
        <p className="text-muted-foreground text-sm">Weekly reviews and accountability history.</p>
      </div>

      {!checkIns || checkIns.length === 0 ? (
        <div className="space-y-6">
          {activePlan ? (
            <>
              <WeeklyReviewForm gamePlanId={activePlan.id} weekNumber={weekNumber} />
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-4">📬</div>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Automated check-ins will also arrive by email on Monday, Wednesday, and Friday.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-lg font-semibold mb-2">No check-ins yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Build your 90-day game plan first. Once active, check-ins will arrive every Monday, Wednesday, and Friday.
              </p>
              <Link href="/onboarding" className={btnPrimary}>
                Build my game plan →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* In-app weekly review — always available at the top */}
          {activePlan && (
            <WeeklyReviewForm gamePlanId={activePlan.id} weekNumber={weekNumber} />
          )}

          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Needs your response ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((checkIn) => (
                  <CheckInCard key={checkIn.id} checkIn={checkIn} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                History
              </h2>
              <div className="space-y-4">
                {past.map((checkIn) => (
                  <CheckInCard key={checkIn.id} checkIn={checkIn} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
