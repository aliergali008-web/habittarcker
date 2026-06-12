import { useSyncExternalStore } from "react";
import type {
  AppData,
  EveningLog,
  Exam,
  Insight,
  MorningCheckin,
  Session,
} from "./types";

const STORAGE_KEY = "studytracker.v1";

const empty: AppData = {
  logs: [],
  checkins: [],
  sessions: [],
  exams: [],
  insights: [],
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
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

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
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
