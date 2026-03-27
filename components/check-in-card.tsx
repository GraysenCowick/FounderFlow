'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CheckIn {
  id: string
  type: string
  status: string
  ai_message: string
  user_response: string | null
  sent_at: string
  responded_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  monday_kickoff: '🎯 Monday Kickoff',
  midweek_pulse: '📊 Midweek Pulse',
  friday_review: '🏁 Friday Review',
  daily_nudge: '✅ Daily Nudge',
  weekly_review: '📝 Weekly Review',
}

const TYPE_COLORS: Record<string, string> = {
  monday_kickoff: 'text-blue-600 border-blue-500/30 bg-blue-50',
  midweek_pulse: 'text-purple-600 border-purple-500/30 bg-purple-50',
  friday_review: 'text-rose-600 border-rose-500/30 bg-rose-50',
  daily_nudge: 'text-violet-600 border-violet-500/30 bg-violet-50',
  weekly_review: 'text-violet-600 border-violet-500/30 bg-violet-50',
}

export function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/check-in/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_in_id: checkIn.id, user_response: response }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      toast.success('Response saved!')
      router.refresh()
    } catch {
      toast.error('Failed to save response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${TYPE_COLORS[checkIn.type] || ''}`}>
              {TYPE_LABELS[checkIn.type] || checkIn.type}
            </Badge>
            <Badge
              variant={checkIn.status === 'responded' ? 'default' : 'outline'}
              className={
                checkIn.status === 'responded'
                  ? 'bg-violet-600/10 text-violet-700 border-violet-600/20 hover:bg-violet-600/10 text-xs'
                  : checkIn.status === 'pending'
                  ? 'text-amber-600 border-amber-500/30 bg-amber-50 text-xs'
                  : 'text-xs'
              }
            >
              {checkIn.status}
            </Badge>
          </div>
          <time className="text-xs text-muted-foreground flex-shrink-0">
            {new Date(checkIn.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
        <CardTitle className="text-sm font-normal text-muted-foreground mt-2 leading-relaxed">
          {checkIn.ai_message}
        </CardTitle>
      </CardHeader>

      {checkIn.status === 'pending' && (
        <>
          <CardContent className="pb-3">
            <Textarea
              placeholder="How's it going? Share your progress..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
          <CardFooter>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Submit response'}
            </Button>
          </CardFooter>
        </>
      )}

      {checkIn.status === 'responded' && checkIn.user_response && (
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Your response:</p>
            <p className="text-sm text-foreground">{checkIn.user_response}</p>
            {checkIn.responded_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(checkIn.responded_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
