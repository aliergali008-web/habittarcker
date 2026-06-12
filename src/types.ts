/** ISO date, local, e.g. "2026-06-12" */
export type ISODate = string;

export interface EveningLog {
  date: ISODate;
  raw: string;
  sleepHours?: number;
  /** 1–5 */
  mood?: number;
  /** subject → minutes studied, as mentioned in the dump */
  studied: Record<string, number>;
  note?: string;
}

export interface MorningCheckin {
  date: ISODate;
  /** 1–5 */
  energy: number;
  /** 1–5 */
  mood: number;
}

export interface Session {
  id: string;
  date: ISODate;
  startedAt: number;
  minutes: number;
  subject?: string;
  /** 1–5, rated at the end */
  focus?: number;
  /** times the user left the app mid-session */
  slips?: number;
}

export interface Exam {
  id: string;
  name: string;
  date: ISODate;
  /** ties the exam to a studied subject so readiness can be computed */
  subject?: string;
}

/**
 * A scheduled memory review. Created when a study session ends,
 * then re-scheduled along the forgetting curve (1 → 3 → 7 → 21 days).
 */
export interface Review {
  id: string;
  subject: string;
  topic?: string;
  due: ISODate;
  /** index into REVIEW_GAPS — how many reviews are already done */
  step: number;
  createdAt: number;
}

export type InsightStatus = "open" | "confirmed" | "dismissed";

export interface Insight {
  id: string;
  question: string;
  status: InsightStatus;
  createdAt: number;
}

export interface Settings {
  /** daily focused-minutes goal */
  dailyGoalMin: number;
  /** for the greeting and the Wrapped card */
  name?: string;
}

export interface AppData {
  logs: EveningLog[];
  checkins: MorningCheckin[];
  sessions: Session[];
  exams: Exam[];
  reviews: Review[];
  insights: Insight[];
  settings: Settings;
}
