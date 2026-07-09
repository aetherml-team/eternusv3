import type { VercelRequest, VercelResponse } from '@vercel/node';
import { weddingContact } from '../public/js/templates/weddingContact';
import { weddingCustomer } from '../public/js/templates/weddingCustomer';
import {
  formatMeetingForEmail,
  getCustomerEmailCopy,
  localizeFormValue,
  normalizeLang,
} from './lib/emailI18n';
import { CalendlyBookingError, createInvitee, isCalendlyConfigured } from './lib/calendly';
import { validateContactForm } from './lib/validateForm';

async function sendResendEmail(
  apiKey: string,
  payload: { to: string; subject: string; html: string }
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      to: payload.to,
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const error = await response.json().catch(() => ({}));
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: string }).message)
      : `Resend error (${response.status})`;
  return { ok: false, error: message };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validateContactForm(req.body || {});
  if (validation.ok === false) {
    return res.status(400).json({ error: validation.error });
  }

  const {
    bride_name,
    groom_name,
    budget,
    email,
    wedding_type,
    additional_info,
    meeting_date,
    meeting_time,
    meeting_start_utc,
    lang,
  } = validation.data;

  const emailLang = normalizeLang(lang);
  const customerCopy = getCustomerEmailCopy(emailLang);

  let calendlyInvite: { cancel_url?: string; reschedule_url?: string } = {};

  if (isCalendlyConfigured()) {
    try {
      calendlyInvite = await createInvitee({
        startTimeUtc: meeting_start_utc,
        name: `${bride_name} & ${groom_name}`,
        email,
      });
    } catch (err: unknown) {
      if (err instanceof CalendlyBookingError) {
        if (err.status === 409) {
          return res.status(409).json({
            error:
              'That meeting time is no longer available. Please choose another date or time.',
          });
        }
        return res.status(err.status).json({ error: err.message });
      }
      const message = err instanceof Error ? err.message : 'Calendly booking failed';
      return res.status(502).json({ error: message });
    }
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY in environment variables' });
  }

  const emailDetails = {
    bride_name,
    groom_name,
    budget: localizeFormValue(emailLang, 'budget', budget),
    wedding_type: localizeFormValue(emailLang, 'wedding_type', wedding_type),
    additional_info,
    email,
    meeting_date,
    meeting_time,
    meeting_display: formatMeetingForEmail(meeting_date, meeting_time, emailLang),
  };

  try {
    const coupleResult = await sendResendEmail(RESEND_API_KEY, {
      to: email,
      subject: customerCopy.subject,
      html: weddingCustomer(emailDetails, customerCopy),
    });

    if (!coupleResult.ok) {
      return res.status(502).json({ error: coupleResult.error || 'Failed to send confirmation email' });
    }

    const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL;
    if (teamEmail) {
      await sendResendEmail(RESEND_API_KEY, {
        to: teamEmail,
        subject: 'New Wedding Planner Form Submission',
        html: weddingContact(emailDetails),
      });
    }

    return res.status(200).json({
      success: true,
      calendly: calendlyInvite,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to send email', details: message });
  }
}
