import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_70040d21c0ea8337a5a4c413c0162aa14f3a3a4a'
    const signature = request.headers.get('x-paystack-signature')

    // Verify Paystack Webhook Signature
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      console.warn('Invalid Paystack signature detected on webhook request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = body.event
    console.log(`Paystack Webhook received event: ${event}`)

    if (event === 'charge.success') {
      const data = body.data
      const reference = data.reference
      const bookingId = data.metadata?.booking_id

      console.log(`Successful charge: ref=${reference}, bookingId=${bookingId}`)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // 1. Update the payment record status to 'released'
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'released',
          payment_method: 'paystack',
        })
        .eq('payment_reference', reference)
        .select()
        .single()

      if (paymentError) {
        console.error('Error updating payment status in webhook:', paymentError.message)
      }

      // 2. Update the booking status to 'verified'
      const targetBookingId = bookingId || payment?.booking_id
      if (targetBookingId) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetBookingId)

        if (bookingError) {
          console.error('Error updating booking status in webhook:', bookingError.message)
        } else {
          console.log(`Successfully verified booking ${targetBookingId} via Paystack webhook`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error in Paystack webhook handler:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
