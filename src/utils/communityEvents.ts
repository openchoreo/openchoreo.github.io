import { useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export type EventCategory = 'Meetups' | 'Community calls' | 'Conferences';

export type CommunityEvent = {
  date: string;
  endDate?: string;
  category: EventCategory;
  title: string;
  location: string;
  description?: string;
  action: string;
  href: string;
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

export function dateSpanLabel(event: CommunityEvent): string {
  const s = parts(event.date);
  const month = MONTHS[s.m - 1];
  if (!event.endDate) return `${month} ${s.d}`;

  const e = parts(event.endDate);
  return e.m === s.m
    ? `${month} ${s.d}-${e.d}`
    : `${month} ${s.d} - ${MONTHS[e.m - 1]} ${e.d}`;
}

export function monthShort(event: CommunityEvent): string {
  return MONTHS_SHORT[parts(event.date).m - 1];
}

export function dayLabel(event: CommunityEvent): string {
  const s = parts(event.date);
  if (!event.endDate) return String(s.d);

  const e = parts(event.endDate);
  return e.m === s.m ? `${s.d}-${e.d}` : String(s.d);
}

export function yearLabel(event: CommunityEvent): string {
  return String(parts(event.date).y);
}

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
