import fs from 'fs';
import path from 'path';

export type SupportedLang = 'en' | 'es';

export interface CustomerEmailCopy {
  lang: SupportedLang;
  siteUrl: string;
  subject: string;
  title: string;
  headerWelcome: string;
  headerTagline: string;
  eyebrow: string;
  greeting: string;
  intro: string;
  receivedDetails: string;
  labelBride: string;
  labelGroom: string;
  labelBudget: string;
  labelWeddingType: string;
  labelMeeting: string;
  labelAdditionalInfo: string;
  noneProvided: string;
  closing: string;
  cta: string;
  footerRights: string;
  footerAddress: string;
}

const WEDDING_TYPE_KEYS: Record<string, string> = {
  'Beach Wedding': 'form.step2.beachWedding',
  'Garden Wedding': 'form.step2.gardenWedding',
  'Destination Wedding': 'form.step2.destinationWedding',
};

const BUDGET_KEYS: Record<string, string> = {
  A: 'form.step3.budget1',
  B: 'form.step3.budget2',
  C: 'form.step3.budget3',
  D: 'form.step3.budget4',
};

const translationCache: Partial<Record<SupportedLang, Record<string, unknown>>> = {};

function loadTranslations(lang: SupportedLang): Record<string, unknown> {
  if (translationCache[lang]) {
    return translationCache[lang] as Record<string, unknown>;
  }
  const filePath = path.join(process.cwd(), 'public', 'lang', `${lang}.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as Record<string, unknown>;
  translationCache[lang] = data;
  return data;
}

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function getNestedString(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const value = getNestedValue(obj, keyPath);
  return typeof value === 'string' ? value : undefined;
}

export function normalizeLang(value: unknown): SupportedLang {
  const code = String(value || 'en')
    .trim()
    .toLowerCase()
    .split('-')[0];
  return code === 'es' ? 'es' : 'en';
}

export function getCustomerEmailCopy(lang: SupportedLang): CustomerEmailCopy {
  const translations = loadTranslations(lang);
  const customer = getNestedValue(translations, 'form.email.customer') as
    | Record<string, string>
    | undefined;
  const fallback = loadTranslations('en');
  const fallbackCustomer = getNestedValue(fallback, 'form.email.customer') as
    | Record<string, string>
    | undefined;

  const pick = (key: string, defaultValue: string): string => {
    const fromLang =
      customer && typeof customer === 'object'
        ? (customer as Record<string, string>)[key]
        : undefined;
    if (fromLang) return fromLang;
    if (fallbackCustomer && typeof fallbackCustomer === 'object') {
      return (fallbackCustomer as Record<string, string>)[key] || defaultValue;
    }
    return defaultValue;
  };

  return {
    lang,
    siteUrl: (process.env.SITE_URL || 'https://eternus-landing.vercel.app').replace(/\/$/, ''),
    subject: pick('subject', 'Thank You for Choosing Eternus for Your Special Day'),
    title: pick('title', 'Your Journey with Eternus Begins'),
    headerWelcome: pick('headerWelcome', 'Welcome to Eternus'),
    headerTagline: pick('headerTagline', 'Your Timeless Journey Awaits'),
    eyebrow: pick('eyebrow', 'Thank You'),
    greeting: pick('greeting', 'Dear {bride_name} & {groom_name},'),
    intro: pick(
      'intro',
      'Thank you for entrusting Eternus with the planning of your special day.'
    ),
    receivedDetails: pick('receivedDetails', 'We have received the following details:'),
    labelBride: pick('labelBride', 'Bride'),
    labelGroom: pick('labelGroom', 'Groom'),
    labelBudget: pick('labelBudget', 'Budget'),
    labelWeddingType: pick('labelWeddingType', 'Wedding Type'),
    labelMeeting: pick('labelMeeting', 'Meeting'),
    labelAdditionalInfo: pick('labelAdditionalInfo', 'Additional Information'),
    noneProvided: pick('noneProvided', 'None provided'),
    closing: pick(
      'closing',
      'Our team will be in touch shortly to discuss the next steps.'
    ),
    cta: pick('cta', 'Discover Our Creations'),
    footerRights: pick('footerRights', 'All Rights Reserved'),
    footerAddress: pick('footerAddress', ''),
  };
}

export function localizeFormValue(
  lang: SupportedLang,
  kind: 'budget' | 'wedding_type',
  rawValue: string
): string {
  const translations = loadTranslations(lang);
  if (kind === 'budget') {
    const key = BUDGET_KEYS[rawValue];
    if (key) return getNestedString(translations, key) || rawValue;
    return rawValue;
  }
  const key = WEDDING_TYPE_KEYS[rawValue];
  if (key) return getNestedString(translations, key) || rawValue;
  return rawValue;
}

export function formatMeetingForEmail(
  meetingDate: string,
  meetingTime: string,
  lang: SupportedLang
): string {
  if (!meetingDate || !meetingTime) return '';
  const parts = meetingDate.split('-').map(Number);
  if (parts.length !== 3) return `${meetingDate} ${meetingTime}`;

  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const timeParts = meetingTime.split(':').map(Number);
  const timeObj = new Date(2000, 0, 1, timeParts[0] || 0, timeParts[1] || 0);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(timeObj);

  return `${dateLabel} — ${timeLabel}`;
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}
