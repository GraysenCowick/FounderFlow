import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const btnPrimary = 'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors whitespace-nowrap'
const btnOutline = 'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors whitespace-nowrap'
const btnGhost = 'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-medium hover:bg-muted text-foreground transition-colors whitespace-nowrap'
const btnPrimaryLg = 'inline-flex items-center justify-center rounded-lg px-8 h-11 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors whitespace-nowrap shadow-sm'
const btnOutlineLg = 'inline-flex items-center justify-center rounded-lg px-6 h-11 text-base font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors whitespace-nowrap'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80 backdrop-blur-sm max-w-7xl mx-auto w-full">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-violet-600">Founder</span>Flow
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className={btnGhost}>Log in</Link>
          <Link href="/signup" className={btnPrimary}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <Badge className="mb-6 bg-violet-600/10 text-violet-600 border-violet-600/20 hover:bg-violet-600/10">
          AI-Powered Goal Coach
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight text-foreground">
          Turn your biggest goal into a{' '}
          <span className="text-violet-600">90-day game plan</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          FounderFlow uses AI — grounded in proven goal-setting and productivity principles — to build your personalized weekly schedule, KPIs, and accountability check-ins.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/signup" className={btnPrimaryLg}>Build my 90-day plan →</Link>
          <Link href="/login" className={btnOutlineLg}>Sign in</Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full text-left">
          {[
            {
              icon: '🎯',
              title: 'AI Game Plan',
              desc: 'Answer a few questions. Get a structured 90-day plan with weekly time blocks and concrete next actions.',
            },
            {
              icon: '📊',
              title: 'KPI Dashboard',
              desc: 'Track result KPIs (outcomes) and activity KPIs (inputs you control) with live progress logging.',
            },
            {
              icon: '✅',
              title: 'Weekly Reviews',
              desc: 'Log your week in-app and get direct coaching from Claude. Stay accountable all quarter.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 shadow-sm text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-muted-foreground text-sm">
          Grounded in{' '}
          <span className="text-foreground font-medium">principle-centered goal setting</span>,{' '}
          <span className="text-foreground font-medium">next-action thinking</span>, and{' '}
          <span className="text-foreground font-medium">importance-over-urgency prioritization</span>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-card">
        © {new Date().getFullYear()} FounderFlow. Built for entrepreneurs who ship.
      </footer>
    </div>
  )
}
