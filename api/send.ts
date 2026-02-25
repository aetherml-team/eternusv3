import type { VercelRequest, VercelResponse } from '@vercel/node'
import {weddingContact } from '../public/js/templates/weddingContact'

export default async function handler(req:VercelRequest, res:VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, bride_name, groom_name, budget, wedding_type, additional_info } = req.body;
  console.log(req.body, 'this body')
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY in environment variables' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        from: 'onboarding@resend.dev',
        subject: 'Wedding Planner Form Submission',
        html: weddingContact({ bride_name, groom_name, budget, wedding_type, additional_info, email}),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
}
