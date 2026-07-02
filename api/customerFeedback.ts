import type { VercelRequest, VercelResponse } from '@vercel/node';
import { weddingCustomer } from '../public/js/templates/weddingCustomer';
import { isValidPersonName, sanitizePersonName } from './lib/validateForm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, bride_name, groom_name, budget, wedding_type, additional_info } = req.body || {};
  const cleanBride = sanitizePersonName(bride_name);
  const cleanGroom = sanitizePersonName(groom_name);

  if (!isValidPersonName(cleanBride) || !isValidPersonName(cleanGroom)) {
    return res.status(400).json({ error: 'Invalid bride or groom name. Use letters only.' });
  }

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
        subject: 'Thank You for Choosing Eternus for Your Special Day',
        html: weddingCustomer({ bride_name: cleanBride, groom_name: cleanGroom, budget, wedding_type, additional_info}),
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
