'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})

type ProfileForm = z.infer<typeof profileSchema>

interface NotificationPrefs {
  notify_monday: boolean
  notify_midweek: boolean
  notify_friday: boolean
  notify_daily: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<{ email: string } | null>(null)
  const [notifs, setNotifs] = useState<NotificationPrefs>({
    notify_monday: true,
    notify_midweek: true,
    notify_friday: true,
    notify_daily: false,
  })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, notify_monday, notify_midweek, notify_friday, notify_daily')
        .eq('id', user.id)
        .single()
      if (data) {
        reset({ full_name: data.full_name })
        setProfile({ email: data.email })
        setNotifs({
          notify_monday: data.notify_monday ?? true,
          notify_midweek: data.notify_midweek ?? true,
          notify_friday: data.notify_friday ?? true,
          notify_daily: data.notify_daily ?? false,
        })
      }
    }
    load()
  }, [supabase, reset])

  const saveProfile = async (data: ProfileForm) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const saveNotifs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update(notifs)
        .eq('id', user.id)
      if (error) throw error
      toast.success('Notification preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const toggleNotif = (key: keyof NotificationPrefs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      toast.success('Account deleted.')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and notification preferences.</p>
      </div>

      {/* Profile */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(saveProfile)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ''} disabled className="text-muted-foreground bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
              disabled={loading}
            >
              Save profile
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Notifications */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose which automated check-ins you receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'notify_monday' as const, label: '🎯 Monday Kickoff', desc: 'Weekly game plan reminder every Monday at 8am' },
            { key: 'notify_midweek' as const, label: '📊 Midweek Pulse', desc: 'Progress check-in every Wednesday at 12pm' },
            { key: 'notify_friday' as const, label: '🏁 Friday Review', desc: 'Weekly wrap-up every Friday at 4pm' },
            { key: 'notify_daily' as const, label: '✅ Daily Nudge', desc: 'Daily task reminder at 9am (optional)' },
          ].map(({ key, label, desc }) => (
            <div key={key}>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif(key)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                    notifs[key] ? 'bg-violet-600' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      notifs[key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
            onClick={saveNotifs}
            disabled={loading}
          >
            Save preferences
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!deleteConfirm ? (
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={() => setDeleteConfirm(true)}
            >
              Delete my account
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-red-700">
                Are you sure? This will permanently delete your account, game plan, KPI history, and all check-ins.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </Button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
