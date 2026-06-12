import type { AppData, ISODate, Session } from "../types";
import { daysAgo, toISODate } from "./dates";

// ---- golden hours -----------------------------------------------------------

export interface HourBucket {
  label: string;
  /** total focused minutes started in this window */
  minutes: number;
  /** average focus rating, if any sessions were rated */
  avgFocus?: number;
  sessions: number;
}

const BUCKETS: { label: string; from: number; to: number }[] = [
  { label: "6–9", from: 6, to: 9 },
  { label: "9–12", from: 9, to: 12 },
  { label: "12–3", from: 12, to: 15 },
  { label: "3–6", from: 15, to: 18 },
  { label: "6–9", from: 18, to: 21 },
  { label: "9–12", from: 21, to: 24 },
];

export function hourBuckets(sessions: Session[]): HourBucket[] {
  return BUCKETS.map((b) => {
    const inWindow = sessions.filter((s) => {
      const h = new Date(s.startedAt).getHours();
      return h >= b.from && h < b.to;
    });
    const rated = inWindow.filter((s) => s.focus !== undefined);
    return {
      label: b.label,
      minutes: inWindow.reduce((a, s) => a + s.minutes, 0),
      avgFocus: rated.length
        ? rated.reduce((a, s) => a + (s.focus ?? 0), 0) / rated.length
        : undefined,
      sessions: inWindow.length,
    };
  });
}

/** The bucket where rated focus is highest — needs at least 2 rated sessions. */
export function goldenWindow(buckets: HourBucket[]): HourBucket | undefined {
  const eligible = buckets.filter(
    (b) => b.avgFocus !== undefined && b.sessions >= 2
  );
  if (eligible.length < 2) return undefined;
  return eligible.reduce((a, b) =>
    (b.avgFocus ?? 0) > (a.avgFocus ?? 0) ? b : a
  );
}

// ---- subject balance --------------------------------------------------------

export interface SubjectStat {
  subject: string;
  /** minutes in the last 14 days (sessions + evening logs) */
  recentMin: number;
  /** days since last touched, or undefined if never */
  daysSince?: number;
}

export function subjectStats(data: AppData): SubjectStat[] {
  const since30 = daysAgo(30);
  const since14 = daysAgo(14);
  const lastTouched = new Map<string, ISODate>();
  const recent = new Map<string, number>();

  const touch = (subject: string, date: ISODate, minutes: number) => {
    const key = subject.toLowerCase();
    if (date < since30) return;
    const prev = lastTouched.get(key);
    if (!prev || date > prev) lastTouched.set(key, date);
    if (date >= since14) recent.set(key, (recent.get(key) ?? 0) + minutes);
  };

  for (const s of data.sessions) if (s.subject) touch(s.subject, s.date, s.minutes);
  for (const l of data.logs)
    for (const [subject, min] of Object.entries(l.studied)) touch(subject, l.date, min);

  const todayIso = toISODate(new Date());
  return [...lastTouched.entries()]
    .map(([subject, last]) => ({
      subject,
      recentMin: recent.get(subject) ?? 0,
      daysSince: Math.round(
        (new Date(todayIso + "T00:00:00").getTime() -
          new Date(last + "T00:00:00").getTime()) /
          86_400_000
      ),
    }))
    .sort((a, b) => b.recentMin - a.recentMin);
}

/** A subject you've studied this month but not touched in 7+ days. */
export function neglectedSubject(stats: SubjectStat[]): SubjectStat | undefined {
  return stats
    .filter((s) => (s.daysSince ?? 0) >= 7)
    .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0))[0];
}

// ---- mood calendar ----------------------------------------------------------

export interface MoodCell {
  date: ISODate;
  day: number;
  mood?: number;
  future: boolean;
}

/** Mood for a date: the evening log wins, morning check-in is the fallback. */
export function moodFor(data: AppData, date: ISODate): number | undefined {
  return (
    data.logs.find((l) => l.date === date)?.mood ??
    data.checkins.find((c) => c.date === date)?.mood
  );
}

/** Cells for the current month plus leading blanks (Mon-first). */
export function monthMood(data: AppData): { blanks: number; cells: MoodCell[] } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayIso = toISODate(now);
  const cells: MoodCell[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = toISODate(new Date(now.getFullYear(), now.getMonth(), day));
    cells.push({ date, day, mood: moodFor(data, date), future: date > todayIso });
  }
  return { blanks: (first.getDay() + 6) % 7, cells };
}

// ---- distraction trend ------------------------------------------------------

export function weekSlips(sessions: Session[]): { slips: number; tracked: number } {
  const week = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i)));
  const tracked = sessions.filter((s) => week.has(s.date) && s.slips !== undefined);
  return {
    slips: tracked.reduce((a, s) => a + (s.slips ?? 0), 0),
    tracked: tracked.length,
  };
}
