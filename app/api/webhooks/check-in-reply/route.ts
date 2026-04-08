import { NextRequest, NextResponse } from 'next/server'

// Placeholder for future inbound email reply handling via Resend webhooks or similar.
// When implemented, this would parse the inbound email, match it to a check-in by user email,
// and call the check-in respond API.

export async function POST(request: NextRequest) {
  // Verify webhook secret before processing any payload
  const webhookSecret = request.headers.get('x-webhook-secret') ||
    request.headers.get('x-resend-signature')
  if (!process.env.WEBHOOK_SECRET || webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log('Received check-in reply webhook:', JSON.stringify(body, null, 2))

    // TODO: Parse inbound email payload (provider-specific format)
    // TODO: Look up user by email address
    // TODO: Find latest pending check-in for that user
    // TODO: Update check-in with user's reply text

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
