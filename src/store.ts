import { useSyncExternalStore } from "react";
import { nextAfter, snoozedDue } from "./lib/reviews";
import { uid } from "./lib/uid";
import type {
  AppData,
  EveningLog,
  Exam,
  Insight,
  MorningCheckin,
  Review,
  Session,
} from "./types";

export { uid };

const STORAGE_KEY = "studytracker.v1";

const empty: AppData = {
  logs: [],
  checkins: [],
  sessions: [],
  exams: [],
  reviews: [],
  insights: [],
  settings: { dailyGoalMin: 120 },
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      ...empty,
      ...parsed,
      settings: { ...empty.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return empty;
  }
}

let data: AppData = load();
const listeners = new Set<() => void>();

function commit(next: AppData) {
  data = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  listeners.forEach((fn) => fn());
}

export function useAppData(): AppData {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => data
  );
}

// ---- mutations -------------------------------------------------------------

export function saveEveningLog(log: EveningLog) {
  const logs = data.logs.filter((l) => l.date !== log.date).concat(log);
  commit({ ...data, logs });
}

export function saveCheckin(checkin: MorningCheckin) {
  const checkins = data.checkins
    .filter((c) => c.date !== checkin.date)
    .concat(checkin);
  commit({ ...data, checkins });
}

export function saveSession(session: Session) {
  commit({ ...data, sessions: [...data.sessions, session] });
}

export function addExam(exam: Exam) {
  commit({ ...data, exams: [...data.exams, exam] });
}

export function removeExam(id: string) {
  commit({ ...data, exams: data.exams.filter((e) => e.id !== id) });
}

export function addReview(review: Review) {
  // one pending review per subject+topic is enough
  const dup = data.reviews.some(
    (r) =>
      r.subject.toLowerCase() === review.subject.toLowerCase() &&
      (r.topic ?? "") === (review.topic ?? "")
  );
  if (dup) return;
  commit({ ...data, reviews: [...data.reviews, review] });
}

/** Mark a review done; schedules the next pass if the cycle isn't finished. */
export function completeReview(id: string) {
  const review = data.reviews.find((r) => r.id === id);
  if (!review) return;
  const rest = data.reviews.filter((r) => r.id !== id);
  const next = nextAfter(review);
  commit({ ...data, reviews: next ? [...rest, next] : rest });
}

export function snoozeReview(id: string) {
  commit({
    ...data,
    reviews: data.reviews.map((r) =>
      r.id === id ? { ...r, due: snoozedDue() } : r
    ),
  });
}

export function dropReview(id: string) {
  commit({ ...data, reviews: data.reviews.filter((r) => r.id !== id) });
}

export function setDailyGoal(dailyGoalMin: number) {
  commit({ ...data, settings: { ...data.settings, dailyGoalMin } });
}

export function addInsight(insight: Insight) {
  commit({ ...data, insights: [...data.insights, insight] });
}

export function resolveInsight(id: string, status: "confirmed" | "dismissed") {
  commit({
    ...data,
    insights: data.insights.map((i) => (i.id === id ? { ...i, status } : i)),
  });
}

export function exportData(): string {
  return JSON.stringify(data, null, 2);
}
