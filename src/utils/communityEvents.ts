import { useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export type EventCategory = 'Meetups' | 'Community calls' | 'Conferences';

/**
 * A single community event. This is the ONE source of truth: there is no
 * separate "past events" list. Whether an event is upcoming or past is derived
 * from its date at render time, so events roll over automatically as the
 * calendar advances — nobody moves anything by hand.
 */
export type CommunityEvent = {
  /** ISO start date, `YYYY-MM-DD`. */
  date: string;
  /** ISO end date for multi-day events, `YYYY-MM-DD`. Omit for single-day. */
  endDate?: string;
  category: EventCategory;
  title: string;
  location: string;
  /** Talk / session detail, shown on the full past-events page. Optional. */
  description?: string;
  /** Pre-event call to action + link (e.g. "Register"). */
  action: string;
  href: string;
  /**
   * Post-event call to action + link (e.g. a recording). Both optional:
   * once an event is past, the label defaults to "More Details" and the link
   * falls back to `href`, so an event you never touch again still renders
   * correctly. Set these only when a recording (or a different link) exists.
   */
  pastAction?: string;
  pastHref?: string;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function endTimestamp(event: CommunityEvent): number {
  const iso = event.endDate ?? event.date;
  return Date.parse(`${iso}T23:59:59-12:00`);
}

export function isPastEvent(event: CommunityEvent, now: Date): boolean {
  return now.getTime() > endTimestamp(event);
}

/** Split all events into upcoming (soonest first) and past (most recent first). */
export function splitEvents(
  events: CommunityEvent[],
  now: Date,
): { upcoming: CommunityEvent[]; past: CommunityEvent[] } {
  const upcoming: CommunityEvent[] = [];
  const past: CommunityEvent[] = [];

  for (const event of events) {
    (isPastEvent(event, now) ? past : upcoming).push(event);
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}

/** Month + day (range), no year: "July 28-30", "November 9-12", "July 1". */
export function dateSpanLabel(event: CommunityEvent): string {
  const s = parts(event.date);
  const month = MONTHS[s.m - 1];
  if (!event.endDate) return `${month} ${s.d}`;

  const e = parts(event.endDate);
  return e.m === s.m
    ? `${month} ${s.d}-${e.d}`
    : `${month} ${s.d} - ${MONTHS[e.m - 1]} ${e.d}`;
}

/** Short month for the date chip, e.g. "JUL". */
export function monthShort(event: CommunityEvent): string {
  return MONTHS_SHORT[parts(event.date).m - 1];
}

/** Day (or same-month day range) for the date chip: "16", "28-30". */
export function dayLabel(event: CommunityEvent): string {
  const s = parts(event.date);
  if (!event.endDate) return String(s.d);

  const e = parts(event.endDate);
  return e.m === s.m ? `${s.d}-${e.d}` : String(s.d);
}

/** Year for the full past-events list, e.g. "2026". */
export function yearLabel(event: CommunityEvent): string {
  return String(parts(event.date).y);
}

/** Meta line for the upcoming grid: "July 28-30 . Yokohama, Japan". */
export function metaLine(event: CommunityEvent): string {
  return `${dateSpanLabel(event)} . ${event.location}`;
}

const categoryMeta: Record<string, { tag: string; variant: string }> = {
  Meetups: { tag: 'Meetup', variant: 'amber' },
  'Community calls': { tag: 'Community call', variant: 'blue' },
  Conferences: { tag: 'Conference', variant: 'green' },
};

export function getCategoryMeta(category: string): {
  tag: string;
  variant: string;
} {
  return categoryMeta[category] ?? { tag: category, variant: 'blue' };
}

export function resolveCta(
  event: CommunityEvent,
  past: boolean,
): { label: string; href: string } {
  if (past) {
    return {
      label: event.pastAction ?? 'More Details',
      href: event.pastHref ?? event.href,
    };
  }
  return { label: event.action, href: event.href };
}

/**
 * Returns the reference "now" for splitting events. During SSR and the first
 * client render it is the build timestamp embedded in siteConfig.customFields
 * (identical on both sides → no hydration mismatch). After mount it switches to
 * the real client clock, so the split stays correct as days pass without a
 * rebuild.
 */
export function useNow(): Date {
  const { siteConfig } = useDocusaurusContext();
  const buildTimestamp = siteConfig.customFields?.buildTimestamp as
    string | undefined;

  const [now, setNow] = useState<Date>(() => new Date(buildTimestamp ?? ''));

  useEffect(() => {
    setNow(new Date());
  }, []);

  return now;
}
