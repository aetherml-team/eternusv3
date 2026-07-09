import {
  MEETING_TIMEZONE,
  dayRangeUtcIso,
  formatSlotLabel,
  isDayRangeInPast,
  monthChunkRangesUtcIso,
} from './meetingTime';

const CALENDLY_API = 'https://api.calendly.com';

export interface CalendlySlot {
  start_time_utc: string;
  label: string;
}

export interface CalendlyConfig {
  token: string;
  eventType: string;
}

export class CalendlyBookingError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'CalendlyBookingError';
  }
}

export function getCalendlyConfig(): CalendlyConfig | null {
  const token = process.env.CALENDLY_API_TOKEN;
  const eventType = process.env.CALENDLY_EVENT_TYPE_URI;
  if (!token || !eventType) return null;
  return { token, eventType };
}

export function isCalendlyConfigured(): boolean {
  return getCalendlyConfig() !== null;
}

async function calendlyFetch(path: string, init?: RequestInit) {
  const config = getCalendlyConfig();
  if (!config) {
    throw new Error('Calendly is not configured');
  }

  const res = await fetch(`${CALENDLY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  return res;
}

function mapAvailableTimes(collection: Array<{ status?: string; start_time?: string }>): CalendlySlot[] {
  return collection
    .filter((item) => item.status === 'available' && item.start_time)
    .map((item) => ({
      start_time_utc: item.start_time as string,
      label: formatSlotLabel(item.start_time as string),
    }))
    .sort((a, b) => Date.parse(a.start_time_utc) - Date.parse(b.start_time_utc));
}

function groupSlotsByDate(slots: CalendlySlot[]): Record<string, CalendlySlot[]> {
  const byDate: Record<string, CalendlySlot[]> = {};

  slots.forEach((slot) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: MEETING_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date(slot.start_time_utc));
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const key = `${get('year')}-${get('month')}-${get('day')}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(slot);
  });

  return byDate;
}

async function fetchAvailableTimesInRange(
  eventType: string,
  start: string,
  end: string
): Promise<CalendlySlot[]> {
  const params = new URLSearchParams({
    event_type: eventType,
    start_time: start,
    end_time: end,
  });

  const res = await calendlyFetch(`/event_type_available_times?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message: string }).message)
        : `Calendly availability failed (${res.status})`
    );
  }

  const data = (await res.json()) as { collection?: Array<{ status?: string; start_time?: string }> };
  return mapAvailableTimes(data.collection || []);
}

export async function getAvailableTimes(dateKey: string): Promise<CalendlySlot[]> {
  const config = getCalendlyConfig();
  if (!config) return [];

  if (isDayRangeInPast(dateKey)) return [];

  const { start, end } = dayRangeUtcIso(dateKey);
  if (Date.parse(start) >= Date.parse(end)) return [];

  return fetchAvailableTimesInRange(config.eventType, start, end);
}

export async function getAvailableTimesForMonth(
  year: number,
  monthIndex: number
): Promise<Record<string, CalendlySlot[]>> {
  const config = getCalendlyConfig();
  if (!config) return {};

  const chunks = monthChunkRangesUtcIso(year, monthIndex);
  if (chunks.length === 0) return {};

  const allSlots: CalendlySlot[] = [];
  for (const { start, end } of chunks) {
    const slots = await fetchAvailableTimesInRange(config.eventType, start, end);
    allSlots.push(...slots);
  }

  return groupSlotsByDate(allSlots);
}

export interface CreateInviteeParams {
  startTimeUtc: string;
  name: string;
  email: string;
  timezone?: string;
}

export interface CreateInviteeResult {
  cancel_url?: string;
  reschedule_url?: string;
  uri?: string;
}

let cachedEventTypeLocationKind: string | null | undefined;

async function getEventTypeLocationKind(): Promise<string | null> {
  if (cachedEventTypeLocationKind !== undefined) {
    return cachedEventTypeLocationKind;
  }

  const config = getCalendlyConfig();
  if (!config) {
    cachedEventTypeLocationKind = null;
    return null;
  }

  const override = process.env.CALENDLY_LOCATION_KIND?.trim();
  if (override) {
    cachedEventTypeLocationKind = override;
    return override;
  }

  const uuid = config.eventType.split('/').pop();
  if (!uuid) {
    cachedEventTypeLocationKind = null;
    return null;
  }

  const res = await calendlyFetch(`/event_types/${uuid}`);
  if (!res.ok) {
    cachedEventTypeLocationKind = null;
    return null;
  }

  const data = (await res.json()) as {
    resource?: { locations?: Array<{ kind?: string }> };
  };
  const locations = data.resource?.locations || [];
  cachedEventTypeLocationKind =
    locations.length === 1 && locations[0].kind ? locations[0].kind : null;
  return cachedEventTypeLocationKind;
}

export async function createInvitee(params: CreateInviteeParams): Promise<CreateInviteeResult> {
  const config = getCalendlyConfig();
  if (!config) {
    throw new Error('Calendly is not configured');
  }

  const locationKind = await getEventTypeLocationKind();
  const body: Record<string, unknown> = {
    event_type: config.eventType,
    start_time: params.startTimeUtc,
    invitee: {
      name: params.name,
      email: params.email,
      timezone: params.timezone || MEETING_TIMEZONE,
    },
  };

  if (locationKind) {
    body.location = { kind: locationKind };
  }

  const res = await calendlyFetch('/invitees', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message: string }).message)
        : `Calendly booking failed (${res.status})`;
    const details =
      typeof err === 'object' && err && 'details' in err
        ? (err as { details?: unknown }).details
        : undefined;
    const detailText = Array.isArray(details)
      ? details
          .map((d) =>
            typeof d === 'object' && d && 'message' in d
              ? String((d as { message: string }).message)
              : ''
          )
          .filter(Boolean)
          .join('; ')
      : '';
    const fullMessage = detailText ? `${message}: ${detailText}` : message;
    const isSlotConflict =
      res.status === 409 ||
      /no longer available|not available|already booked|time slot/i.test(fullMessage);
    const status = isSlotConflict ? 409 : res.status === 400 ? 400 : res.status;
    throw new CalendlyBookingError(status, fullMessage);
  }

  const data = (await res.json()) as { resource?: CreateInviteeResult };
  return data.resource || {};
}
