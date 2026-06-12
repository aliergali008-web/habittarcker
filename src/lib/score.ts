import type { AppData } from "../types";
import { daysAgo } from "./dates";

export interface ScoreBreakdown {
  score: number;
  volume: number;
  quality: number;
  discipline: number;
  consistency: number;
}

/**
 * Focus Score — one honest number for the last 7 days.
 *   40% volume      focused minutes vs. the weekly goal
 *   30% quality     average focus rating
 *   15% discipline  how rarely attention slipped mid-session
 *   15% consistency days with any studying or logging
 */
export function focusScore(data: AppData): ScoreBreakdown | undefined {
  const week = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i)));
  const sessions = data.sessions.filter((s) => week.has(s.date));
  const logs = data.logs.filter((l) => week.has(l.date));
  if (sessions.length === 0 && logs.length === 0) return undefined;

  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const volume = Math.min(1, minutes / (data.settings.dailyGoalMin * 7));

  const rated = sessions.filter((s) => s.focus !== undefined);
  const quality = rated.length
    ? rated.reduce((a, s) => a + (s.focus ?? 0), 0) / rated.length / 5
    : 0.5;

  const tracked = sessions.filter((s) => s.slips !== undefined);
  const slipsPer = tracked.length
    ? tracked.reduce((a, s) => a + (s.slips ?? 0), 0) / tracked.length
    : 0;
  const discipline = Math.max(0, 1 - slipsPer / 3);

  const activeDays = new Set([
    ...sessions.map((s) => s.date),
    ...logs.map((l) => l.date),
  ]).size;
  const consistency = activeDays / 7;

  const score = Math.round(
    100 * (0.4 * volume + 0.3 * quality + 0.15 * discipline + 0.15 * consistency)
  );
  return { score, volume, quality, discipline, consistency };
}
