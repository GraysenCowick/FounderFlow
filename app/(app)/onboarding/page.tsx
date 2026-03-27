import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If they already have an active plan, go to dashboard
  const { data: existingPlan } = await supabase
    .from('game_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (existingPlan) redirect('/dashboard')

  return (
    <div className="flex-1 p-6 md:p-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Let&apos;s build your <span className="text-violet-600">90-day game plan</span>
        </h1>
        <p className="text-muted-foreground">
          Answer a few questions. AI does the rest.
        </p>
      </div>
      <OnboardingForm />
    </div>
  )
}
