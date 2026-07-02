const NAME_RE = /^[\p{L}]+(?: [\p{L}]+)*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export const MEETING_TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const TIMEZONE = 'America/Mexico_City';
const BUFFER_MS = 60 * 60 * 1000;

export function sanitizePersonName(value: unknown): string {
  const str = String(value || '');
  let cleaned: string;
  try {
    cleaned = str.replace(/[^\p{L}\s]/gu, '');
  } catch {
    cleaned = str.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function isValidPersonName(value: unknown): boolean {
  const name = sanitizePersonName(value);
  return name.length >= 2 && name.length <= 80 && NAME_RE.test(name);
}

export function slotDateTimeMs(dateKey: string, timeStr: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  let best = utcGuess;
  for (let offset = -16; offset <= 16; offset++) {
    const candidate = utcGuess + offset * 60 * 60 * 1000;
    const parts = formatter.formatToParts(new Date(candidate));
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
    if (
      get('year') === y &&
      get('month') === m &&
      get('day') === d &&
      get('hour') === hh &&
      get('minute') === mm
    ) {
      best = candidate;
      break;
    }
  }
  return best;
}

export function isValidMeetingSlot(meetingDate: unknown, meetingTime: unknown): boolean {
  const date = String(meetingDate || '');
  const time = String(meetingTime || '');
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return false;
  if (!MEETING_TIME_SLOTS.includes(time)) return false;
  const slotMs = slotDateTimeMs(date, time);
  return slotMs >= Date.now() + BUFFER_MS;
}

export interface ContactFormBody {
  bride_name?: unknown;
  groom_name?: unknown;
  email?: unknown;
  budget?: unknown;
  wedding_type?: unknown;
  additional_info?: unknown;
  meeting_date?: unknown;
  meeting_time?: unknown;
}

export function validateContactForm(body: ContactFormBody): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
  const bride_name = sanitizePersonName(body.bride_name);
  const groom_name = sanitizePersonName(body.groom_name);
  const email = String(body.email || '').trim();
  const budget = String(body.budget || '').trim();
  const wedding_type = String(body.wedding_type || '').trim();
  const additional_info = String(body.additional_info || '').trim();
  const meeting_date = String(body.meeting_date || '').trim();
  const meeting_time = String(body.meeting_time || '').trim();

  if (!isValidPersonName(bride_name)) {
    return { ok: false, error: 'Invalid bride name. Use letters only (2–80 characters).' };
  }
  if (!isValidPersonName(groom_name)) {
    return { ok: false, error: 'Invalid groom name. Use letters only (2–80 characters).' };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  if (!budget) {
    return { ok: false, error: 'Budget is required.' };
  }
  if (!wedding_type) {
    return { ok: false, error: 'Wedding type is required.' };
  }
  if (!isValidMeetingSlot(meeting_date, meeting_time)) {
    return { ok: false, error: 'Invalid or unavailable meeting date/time.' };
  }

  return {
    ok: true,
    data: {
      bride_name,
      groom_name,
      email,
      budget,
      wedding_type,
      additional_info,
      meeting_date,
      meeting_time,
    },
  };
}
