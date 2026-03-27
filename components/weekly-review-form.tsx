'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface WeeklyReviewFormProps {
  gamePlanId: string
  weekNumber: number
}

export function WeeklyReviewForm({ gamePlanId, weekNumber }: WeeklyReviewFormProps) {
  const [open, setOpen] = useState(false)
  const [accomplishments, setAccomplishments] = useState('')
  const [blockers, setBlockers] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [loading, setLoading] = useState(false)
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!accomplishments.trim() || !blockers.trim() || !nextFocus.trim()) {
      toast.error('Please fill in all three fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/check-in/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_plan_id: gamePlanId,
          accomplishments,
          blockers,
          next_focus: nextFocus,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setClaudeResponse(data.ai_response)
      router.refresh()
    } catch {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (claudeResponse) {
    return (
      <Card className="border-violet-200 bg-violet-50/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>Week {weekNumber} Review</span>
            <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-violet-600/10 text-violet-700 border border-violet-600/20">
              Submitted
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border border-violet-200/70 rounded-lg p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
              Claude&apos;s coaching response
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{claudeResponse}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!open) {
    return (
      <Card className="border-dashed border-border shadow-sm">
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Week {weekNumber} Review</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Log your week, get coaching from Claude.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-sm px-4 h-8 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Start review →
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-violet-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Week {weekNumber} Review</CardTitle>
        <p className="text-xs text-muted-foreground">Answer honestly — Claude uses this to sharpen your plan.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="accomplishments" className="text-sm font-medium">What did you accomplish this week?</Label>
          <Textarea
            id="accomplishments"
            placeholder="Be specific. Numbers and concrete outcomes are better than vague descriptions."
            rows={3}
            value={accomplishments}
            onChange={(e) => setAccomplishments(e.target.value)}
            className="resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blockers" className="text-sm font-medium">What got in your way?</Label>
          <Textarea
            id="blockers"
            placeholder="What slowed you down, distracted you, or stayed undone?"
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            className="resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next_focus" className="text-sm font-medium">What&apos;s your #1 focus next week?</Label>
          <Textarea
            id="next_focus"
            placeholder="One clear priority. What's the most important thing you'll do?"
            rows={2}
            value={nextFocus}
            onChange={(e) => setNextFocus(e.target.value)}
            className="resize-none"
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm px-4 h-8 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Getting coaching...' : 'Submit for coaching →'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
