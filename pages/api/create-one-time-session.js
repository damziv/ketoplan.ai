// pages/api/create-one-time-session.js
export const config = { api: { bodyParser: true } }

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only
)

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { email } = req.body || {}
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required.' })
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: '4-Week Hormone Balance Health Guide' },
            unit_amount: 599, // €5.99
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success-1time?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/landing-offer`,
      allow_promotion_codes: false,
    })

    // ✅ Record a pending order in the new table
    try {
      await supabase.from('orders').insert({
        email,
        stripe_session_id: session.id,
        status: 'pending',
        metadata: { source: 'retarget-landing' },
      })
    } catch (e) {
      console.error('Supabase insert failed:', e?.message || e)
      // don’t block checkout
    }

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to create checkout session.' })
  }
}
