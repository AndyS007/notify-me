import { Translations } from '../i18n/en';

export function formatRelativeTime(timestamp: number, t: Translations['time']): string {
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t.justNow;
  const min = Math.floor(sec / 60);
  if (min < 60) return t.minutesAgo(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.hoursAgo(hr);
  const day = Math.floor(hr / 24);
  if (day < 7) return t.daysAgo(day);
  return new Date(timestamp).toLocaleDateString();
}
