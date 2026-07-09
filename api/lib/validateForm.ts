import {
  isoUtcToLocalParts,
  isValidIsoUtc,
  MEETING_BUFFER_MS,
  MEETING_TIMEZONE,
  slotDateTimeMs,
} from './meetingTime';

const NAME_RE = /^[\p{L}]+(?: [\p{L}]+)*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Legacy fallback slots when Calendly is not configured (local static serve). */
export const MEETING_TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export { MEETING_TIMEZONE, MEETING_BUFFER_MS, slotDateTimeMs };

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

export function isValidMeetingSlot(meetingDate: unknown, meetingTime: unknown): boolean {
  const date = String(meetingDate || '');
  const time = String(meetingTime || '');
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return false;
  if (!MEETING_TIME_SLOTS.includes(time)) return false;
  const slotMs = slotDateTimeMs(date, time);
  return slotMs >= Date.now() + MEETING_BUFFER_MS;
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
  meeting_start_utc?: unknown;
  lang?: unknown;
}

export function validateContactForm(
  body: ContactFormBody
): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
  const bride_name = sanitizePersonName(body.bride_name);
  const groom_name = sanitizePersonName(body.groom_name);
  const email = String(body.email || '').trim();
  const budget = String(body.budget || '').trim();
  const wedding_type = String(body.wedding_type || '').trim();
  const additional_info = String(body.additional_info || '').trim();
  const meeting_start_utc = String(body.meeting_start_utc || '').trim();

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

  let meeting_date = String(body.meeting_date || '').trim();
  let meeting_time = String(body.meeting_time || '').trim();

  if (meeting_start_utc && isValidIsoUtc(meeting_start_utc)) {
    const local = isoUtcToLocalParts(meeting_start_utc);
    meeting_date = local.meeting_date;
    meeting_time = local.meeting_time;
  } else if (!isValidMeetingSlot(meeting_date, meeting_time)) {
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
      meeting_start_utc: meeting_start_utc || new Date(slotDateTimeMs(meeting_date, meeting_time)).toISOString(),
      lang: normalizeFormLang(body.lang),
    },
  };
}

function normalizeFormLang(value: unknown): string {
  const code = String(value || 'en')
    .trim()
    .toLowerCase()
    .split('-')[0];
  return code === 'es' ? 'es' : 'en';
}
