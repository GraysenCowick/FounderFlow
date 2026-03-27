'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/check-ins', label: 'Check-ins', icon: '✅' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export function SidebarNav({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <nav className="space-y-0.5">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname === item.href || pathname.startsWith(item.href + '/')
              ? 'bg-violet-600/10 text-violet-700 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border bg-card px-4 py-6 flex-shrink-0 shadow-sm">
        <div className="mb-8 px-1">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            <span className="text-violet-600">Founder</span>Flow
          </Link>
        </div>
        <NavLinks />
        <div className="mt-auto pt-6 border-t border-border">
          {userName && (
            <p className="text-xs text-muted-foreground mb-3 truncate px-1">{userName}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out...' : '↩ Sign out'}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-sm">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="text-violet-600">Founder</span>Flow
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-lg font-bold tracking-tight" onClick={() => setMobileOpen(false)}>
                <span className="text-violet-600">Founder</span>Flow
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <span className="text-xl">✕</span>
              </button>
            </div>
            <NavLinks />
            <div className="mt-auto pt-6 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out...' : '↩ Sign out'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
