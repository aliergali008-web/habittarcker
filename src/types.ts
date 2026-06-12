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
}

export interface Exam {
  id: string;
  name: string;
  date: ISODate;
}

export type InsightStatus = "open" | "confirmed" | "dismissed";

export interface Insight {
  id: string;
  question: string;
  status: InsightStatus;
  createdAt: number;
}

export interface AppData {
  logs: EveningLog[];
  checkins: MorningCheckin[];
  sessions: Session[];
  exams: Exam[];
  insights: Insight[];
}
