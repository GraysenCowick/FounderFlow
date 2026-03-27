'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface KpiUpdateButtonProps {
  gamePlanId: string
  kpiName: string
  kpiType: 'result' | 'activity'
}

export function KpiUpdateButton({ gamePlanId, kpiName, kpiType }: KpiUpdateButtonProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSave = async () => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      toast.error('Enter a valid number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/kpi/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_plan_id: gamePlanId, kpi_name: kpiName, kpi_type: kpiType, value: num }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Progress logged')
      setValue('')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to log progress')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-violet-600 transition-colors underline-offset-2 hover:underline"
      >
        Update progress
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="0"
        className="w-20 h-6 px-2 text-xs bg-background border border-input rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-600"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-xs px-2 h-6 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Save'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}
