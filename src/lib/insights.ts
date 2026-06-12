import type { AppData, Insight } from "../types";
import { uid } from "./uid";

const MIN_LOGS = 8;
const MIN_GROUP = 3;
const MIN_GAP = 0.7;
const ONE_WEEK = 7 * 86_400_000;

/**
 * The insight engine. Deliberately conservative:
 * - needs a minimum of data before it speaks at all
 * - surfaces at most one open question, at most once a week
 * - phrases findings as questions, never verdicts
 */
export function maybeGenerateInsight(data: AppData): Insight | null {
  const hasOpen = data.insights.some((i) => i.status === "open");
  if (hasOpen) return null;

  const lastCreated = Math.max(0, ...data.insights.map((i) => i.createdAt));
  if (Date.now() - lastCreated < ONE_WEEK) return null;

  const logsByDate = new Map(data.logs.map((l) => [l.date, l]));
  if (logsByDate.size < MIN_LOGS) return null;

  // Compare focus ratings on days following short vs. adequate sleep.
  const lowSleep: number[] = [];
  const okSleep: number[] = [];
  for (const session of data.sessions) {
    if (session.focus === undefined) continue;
    const prevDate = new Date(session.date + "T00:00:00");
    prevDate.setDate(prevDate.getDate() - 1);
    const prev = logsByDate.get(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`
    );
    if (!prev || prev.sleepHours === undefined) continue;
    (prev.sleepHours < 6 ? lowSleep : okSleep).push(session.focus);
  }

  if (lowSleep.length < MIN_GROUP || okSleep.length < MIN_GROUP) return null;

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const gap = avg(okSleep) - avg(lowSleep);
  if (gap < MIN_GAP) return null;

  const question =
    `Your focus after nights under 6 hours of sleep averages ` +
    `${avg(lowSleep).toFixed(1)}/5, but ${avg(okSleep).toFixed(1)}/5 after ` +
    `longer nights. Notice anything?`;

  // don't repeat a question the user already answered
  if (data.insights.some((i) => i.question === question)) return null;

  return { id: uid(), question, status: "open", createdAt: Date.now() };
}
