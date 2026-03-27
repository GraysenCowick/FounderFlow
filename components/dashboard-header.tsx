import { Badge } from '@/components/ui/badge'

interface DashboardHeaderProps {
  goalStatement: string
  ninetyDayTarget: string
  createdAt: string
}

export function DashboardHeader({ goalStatement, ninetyDayTarget, createdAt }: DashboardHeaderProps) {
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = Math.max(0, 90 - daysSinceStart)
  const weekNumber = Math.min(13, Math.floor(daysSinceStart / 7) + 1)
  const progressPct = Math.min(100, Math.round((daysSinceStart / 90) * 100))

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-violet-600/10 text-violet-700 border-violet-600/20 hover:bg-violet-600/10 font-medium">
              Week {weekNumber} of 13
            </Badge>
            <Badge variant="outline" className="text-muted-foreground font-normal">
              {daysRemaining} days left
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{goalStatement}</h1>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>90-day progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">90-Day Target</p>
        <p className="text-violet-700 font-medium">{ninetyDayTarget}</p>
      </div>
    </div>
  )
}
