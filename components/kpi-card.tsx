'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { KpiUpdateButton } from '@/components/kpi-update-button'
import { KpiEditButton } from '@/components/kpi-edit-button'

interface ResultKpi {
  name: string
  target: string
  current: string
}

interface ActivityKpi {
  name: string
  target: string
  unit: string
  frequency: string
}

function parseNumber(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export function ResultKpiCard({
  kpi,
  gamePlanId,
  kpiIndex,
  loggedValue,
}: {
  kpi: ResultKpi
  gamePlanId: string
  kpiIndex: number
  loggedValue?: number | null
}) {
  const current = loggedValue ?? parseNumber(kpi.current)
  const target = parseNumber(kpi.target)
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const displayCurrent = loggedValue !== null && loggedValue !== undefined ? String(loggedValue) : kpi.current

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs text-violet-600 border-violet-600/30 bg-violet-600/5">
            Result KPI
          </Badge>
          <div className="flex items-center gap-2">
            <KpiEditButton
              gamePlanId={gamePlanId}
              kpiIndex={kpiIndex}
              kpiType="result"
              initialName={kpi.name}
              initialTarget={kpi.target}
            />
            <span className="text-sm font-semibold text-violet-600">{pct}%</span>
          </div>
        </div>
        <CardTitle className="text-base font-semibold mt-1">{kpi.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={pct} className="h-2 mb-3" />
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Current: <span className="text-foreground font-medium">{displayCurrent}</span></span>
          <span>Target: <span className="text-foreground font-medium">{kpi.target}</span></span>
        </div>
        <KpiUpdateButton gamePlanId={gamePlanId} kpiName={kpi.name} kpiType="result" />
      </CardContent>
    </Card>
  )
}

export function ActivityKpiCard({
  kpi,
  gamePlanId,
  kpiIndex,
  loggedValue,
}: {
  kpi: ActivityKpi
  gamePlanId: string
  kpiIndex: number
  loggedValue?: number | null
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600/30 bg-blue-600/5">
            Activity KPI
          </Badge>
          <KpiEditButton
            gamePlanId={gamePlanId}
            kpiIndex={kpiIndex}
            kpiType="activity"
            initialName={kpi.name}
            initialTarget={kpi.target}
            initialUnit={kpi.unit}
            initialFrequency={kpi.frequency}
          />
        </div>
        <CardTitle className="text-base font-semibold mt-1">{kpi.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-bold text-foreground">
            {loggedValue !== null && loggedValue !== undefined ? loggedValue : kpi.target}
          </span>
          <span className="text-sm text-muted-foreground">{kpi.unit}</span>
          {loggedValue !== null && loggedValue !== undefined && (
            <span className="text-xs text-muted-foreground ml-1">/ {kpi.target} target</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{kpi.frequency}</p>
        <KpiUpdateButton gamePlanId={gamePlanId} kpiName={kpi.name} kpiType="activity" />
      </CardContent>
    </Card>
  )
}
