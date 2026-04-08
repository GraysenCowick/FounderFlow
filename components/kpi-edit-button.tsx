'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PencilIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ResultKpiEditProps {
  gamePlanId: string
  kpiIndex: number
  kpiType: 'result'
  initialName: string
  initialTarget: string
}

interface ActivityKpiEditProps {
  gamePlanId: string
  kpiIndex: number
  kpiType: 'activity'
  initialName: string
  initialTarget: string
  initialUnit: string
  initialFrequency: string
}

type KpiEditButtonProps = ResultKpiEditProps | ActivityKpiEditProps

export function KpiEditButton(props: KpiEditButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(props.initialName)
  const [target, setTarget] = useState(props.initialTarget)
  const [unit, setUnit] = useState(props.kpiType === 'activity' ? props.initialUnit : '')
  const [frequency, setFrequency] = useState(props.kpiType === 'activity' ? props.initialFrequency : '')
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim() || !target.trim()) {
      toast.error('Name and target are required')
      return
    }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        game_plan_id: props.gamePlanId,
        kpi_type: props.kpiType,
        kpi_index: props.kpiIndex,
        name: name.trim(),
        target: target.trim(),
      }
      if (props.kpiType === 'activity') {
        body.unit = unit.trim()
        body.frequency = frequency.trim()
      }
      const res = await fetch('/api/kpi/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to update KPI')
        return
      }
      toast.success('KPI updated')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit KPI"
        className="text-muted-foreground hover:text-violet-600 transition-colors"
      >
        <PencilIcon className="w-3.5 h-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit KPI</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="kpi-name">Name</Label>
              <Input
                id="kpi-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prospects contacted per week"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="kpi-target">Target</Label>
              <Input
                id="kpi-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={props.kpiType === 'result' ? 'e.g. $15,000' : 'e.g. 20'}
              />
            </div>
            {props.kpiType === 'activity' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="kpi-unit">Unit</Label>
                  <Input
                    id="kpi-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. calls, hours, proposals"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="kpi-frequency">Frequency</Label>
                  <Input
                    id="kpi-frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="e.g. per week, daily"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
