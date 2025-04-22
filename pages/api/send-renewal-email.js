// File: /pages/api/send-renewal-email.js

import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://yourdomain.com';
    const successUrl = `${baseUrl}/success-renew?email=${encodeURIComponent(email)}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: '🎉 Your New Keto Plan is Ready!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">🥑 Keto Plan Renewal</h2>
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            Your subscription has been successfully renewed. You can now generate your new personalized keto meal plan for this month!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${successUrl}" style="background-color: #22c55e; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Generate My New Plan 🍽️
            </a>
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`📧 Renewal email sent to ${email}`);
    res.status(200).json({ message: 'Renewal email sent' });
  } catch (err) {
    console.error('❌ Failed to send renewal email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
