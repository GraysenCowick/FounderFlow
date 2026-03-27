import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sign out first so the session is invalidated
    await supabase.auth.signOut()

    // Use service role to delete the auth user — cascades to profiles → all data
    const serviceClient = await createServiceClient()
    const { error } = await serviceClient.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Account deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
