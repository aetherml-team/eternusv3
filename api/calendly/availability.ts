import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAvailableTimes,
  getAvailableTimesForMonth,
  isCalendlyConfigured,
} from '../lib/calendly';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isCalendlyConfigured()) {
    return res.status(503).json({
      configured: false,
      error: 'Calendly is not configured. Set CALENDLY_API_TOKEN and CALENDLY_EVENT_TYPE_URI.',
    });
  }

  const date = typeof req.query.date === 'string' ? req.query.date : '';
  const month = typeof req.query.month === 'string' ? req.query.month : '';

  try {
    if (month && MONTH_RE.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      if (monthIndex < 0 || monthIndex > 11) {
        return res.status(400).json({ error: 'Invalid month.' });
      }
      const byDate = await getAvailableTimesForMonth(year, monthIndex);
      return res.status(200).json({ configured: true, by_date: byDate });
    }

    if (date && DATE_RE.test(date)) {
      const slots = await getAvailableTimes(date);
      return res.status(200).json({ configured: true, slots });
    }

    return res.status(400).json({ error: 'Provide ?date=YYYY-MM-DD or ?month=YYYY-MM' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load availability';
    return res.status(502).json({ configured: true, error: message });
  }
}
