import type { DayType } from '../types';

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

const clockFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const clockWithSecondsFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Istanbul',
  weekday: 'short',
});

/** Midnight of the current Istanbul service day, as a real Date. */
export function istanbulMidnight(date: Date): Date {
  const shifted = new Date(date.getTime() + ISTANBUL_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  return new Date(Date.UTC(year, month, day) - ISTANBUL_OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Build a Date for an Istanbul wall-clock time on the given service day. */
export function atIstanbulTime(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return new Date(day.getTime() + (hours * 60 + minutes) * 60 * 1000);
}

export function isWeekend(day: Date): boolean {
  const weekday = weekdayFormatter.format(day);
  return weekday === 'Sat' || weekday === 'Sun';
}

export function dayType(day: Date): DayType {
  const weekday = weekdayFormatter.format(day);
  return weekday === 'Sat' ? 'saturday' : weekday === 'Sun' ? 'sunday' : 'weekday';
}

/** Service days whose night runs into Saturday or Sunday morning. */
export function hasLateNight(day: Date): boolean {
  const weekday = weekdayFormatter.format(day);
  return weekday === 'Fri' || weekday === 'Sat';
}

export function dayKey(day: Date): string {
  return dateFormatter.format(day);
}

export function formatTime(date: Date, withSeconds = false): string {
  return (withSeconds ? clockWithSecondsFormatter : clockFormatter).format(date);
}
