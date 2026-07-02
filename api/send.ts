import type { VercelRequest, VercelResponse } from '@vercel/node';
import { weddingContact } from '../public/js/templates/weddingContact';
import { validateContactForm } from './lib/validateForm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validateContactForm(req.body || {});
  if (validation.ok === false) {
    return res.status(400).json({ error: validation.error });
  }

  const { bride_name, groom_name, budget, email, wedding_type, additional_info, meeting_date, meeting_time } =
    validation.data;

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
        html: weddingContact({
          bride_name,
          groom_name,
          budget,
          wedding_type,
          additional_info,
          email,
          meeting_date,
          meeting_time,
        }),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to send email', details: message });
  }
}
