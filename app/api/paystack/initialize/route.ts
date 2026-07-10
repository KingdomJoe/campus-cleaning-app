import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const { bookingId, email, amount } = await request.json()

    if (!bookingId || !email || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400, headers: corsHeaders })
    }

    // Initialize Paystack transaction
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_70040d21c0ea8337a5a4c413c0162aa14f3a3a4a'
    
    // Amount must be in kobo (GHS/NGN * 100)
    const amountInKobo = Math.round(Number(amount) * 100)

    console.log(`Initializing Paystack transaction for booking ${bookingId}, amount: ${amountInKobo} kobo`)

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        callback_url: `uberforcleaning://(client)/bookings/${bookingId}`, // Deep link back to Expo mobile app
        metadata: {
          booking_id: bookingId,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization failed:', paystackData)
      return NextResponse.json({ error: paystackData.message || 'Paystack initialization failed' }, { status: 500, headers: corsHeaders })
    }

    // Update Supabase payment record with paystack reference
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the payment record associated with this booking
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (!fetchError && payment) {
      // Save the Paystack reference and change method to paystack
      await supabase
        .from('payments')
        .update({
          payment_reference: paystackData.data.reference,
          payment_method: 'paystack',
        })
        .eq('id', payment.id)
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error in Paystack initialization route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
