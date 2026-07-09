export const MEETING_TIMEZONE = 'America/Mexico_City';
export const MEETING_BUFFER_MS = 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function slotDateTimeMs(dateKey: string, timeStr: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEETING_TIMEZONE,
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

export function msToIsoUtc(ms: number): string {
  return new Date(ms).toISOString();
}

export function isoUtcToLocalParts(isoUtc: string): { meeting_date: string; meeting_time: string } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEETING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(isoUtc));
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    meeting_date: `${get('year')}-${get('month')}-${get('day')}`,
    meeting_time: `${hour}:${get('minute')}`,
  };
}

export function formatSlotLabel(isoUtc: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEETING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const label = formatter.format(new Date(isoUtc));
  return label === '24:00' ? '00:00' : label;
}

/** Calendly allows at most 7 days per availability request. */
export const CALENDLY_MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Calendly rejects start_time that is not strictly in the future at request time. */
export const CALENDLY_START_BUFFER_MS = 2 * 60 * 1000;

function futureStartMs(minStartMs: number): number {
  return Math.max(minStartMs, Date.now() + CALENDLY_START_BUFFER_MS);
}

/** UTC ISO range covering an entire calendar day in Mexico City (start clamped to now). */
export function dayRangeUtcIso(dateKey: string): { start: string; end: string } {
  if (!DATE_RE.test(dateKey)) {
    throw new Error('Invalid date key');
  }
  const startMs = futureStartMs(slotDateTimeMs(dateKey, '00:00'));
  const endMs = slotDateTimeMs(dateKey, '23:59') + 59 * 1000;
  return {
    start: msToIsoUtc(startMs),
    end: msToIsoUtc(endMs),
  };
}

/** True when the day range is entirely in the past. */
export function isDayRangeInPast(dateKey: string): boolean {
  const endMs = slotDateTimeMs(dateKey, '23:59') + 59 * 1000;
  return endMs <= Date.now();
}

/**
 * Split a calendar month into ≤7-day UTC ranges for Calendly (start clamped to now).
 */
export function monthChunkRangesUtcIso(
  year: number,
  monthIndex: number
): Array<{ start: string; end: string }> {
  const firstKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const lastKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  let chunkStartMs = slotDateTimeMs(firstKey, '00:00');
  const monthEndMs = slotDateTimeMs(lastKey, '23:59') + 59 * 1000;
  const chunks: Array<{ start: string; end: string }> = [];

  while (chunkStartMs < monthEndMs) {
    const chunkEndMs = Math.min(chunkStartMs + CALENDLY_MAX_RANGE_MS - 1, monthEndMs);
    const effectiveStart = futureStartMs(chunkStartMs);
    if (effectiveStart < chunkEndMs) {
      chunks.push({
        start: msToIsoUtc(effectiveStart),
        end: msToIsoUtc(chunkEndMs),
      });
    }
    chunkStartMs += CALENDLY_MAX_RANGE_MS;
  }

  return chunks;
}

export function isValidIsoUtc(value: unknown): boolean {
  const s = String(value || '').trim();
  if (!s) return false;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return false;
  return ms >= Date.now() + MEETING_BUFFER_MS;
}
