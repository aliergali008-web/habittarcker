import type { AppData, Exam } from "../types";
import { daysAgo, today } from "./dates";

/**
 * Exam readiness, 0–100, for exams linked to a subject.
 *   55% coverage  minutes on the subject in the last 14 days (vs ~43 min/day)
 *   25% recency   how recently the subject was touched
 *   20% reviews   overdue memory checks on the subject pull it down
 * It's a prep meter, not a prophecy — but it beats guessing.
 */
export function readiness(data: AppData, exam: Exam): number | undefined {
  const subject = exam.subject?.trim().toLowerCase();
  if (!subject) return undefined;

  const since = daysAgo(14);
  let minutes = 0;
  let lastTouched: string | undefined;

  for (const s of data.sessions) {
    if (s.subject?.toLowerCase() !== subject) continue;
    if (s.date >= since) minutes += s.minutes;
    if (!lastTouched || s.date > lastTouched) lastTouched = s.date;
  }
  for (const l of data.logs)
    for (const [name, min] of Object.entries(l.studied)) {
      if (name.toLowerCase() !== subject) continue;
      if (l.date >= since) minutes += min;
      if (!lastTouched || l.date > lastTouched) lastTouched = l.date;
    }

  const coverage = Math.min(1, minutes / 600);

  const daysSince = lastTouched
    ? Math.round(
        (new Date(today() + "T00:00:00").getTime() -
          new Date(lastTouched + "T00:00:00").getTime()) /
          86_400_000
      )
    : Infinity;
  const recency =
    daysSince <= 1 ? 1 : daysSince <= 3 ? 0.8 : daysSince <= 7 ? 0.5 : 0.15;

  const overdue = data.reviews.filter(
    (r) => r.subject.toLowerCase() === subject && r.due < today()
  ).length;
  const reviews = Math.max(0, 1 - 0.3 * overdue);

  return Math.round(100 * (0.55 * coverage + 0.25 * recency + 0.2 * reviews));
}
