import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkInResponseSchema } from '@/lib/validators/check-in'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkInResponseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { check_in_id, user_response, response_data } = parsed.data

    // Verify the check-in belongs to this user
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('id, status, user_id')
      .eq('id', check_in_id)
      .eq('user_id', user.id)
      .single()

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    if (checkIn.status !== 'pending') {
      return NextResponse.json({ error: 'Check-in already responded' }, { status: 400 })
    }

    const { error } = await supabase
      .from('check_ins')
      .update({
        status: 'responded',
        user_response,
        response_data: response_data || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', check_in_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Check-in update error:', error)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Check-in respond error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
