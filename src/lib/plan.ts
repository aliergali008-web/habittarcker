import type { AppData, Exam } from "../types";
import { daysUntil } from "./dates";

export interface DayPlan {
  text: string;
  meta: string;
}

export function nextExam(exams: Exam[]): Exam | undefined {
  return exams
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];
}

/**
 * The adaptive plan. Pure logic, per the product principles:
 * low energy gets a small honest task, high energy gets real work,
 * and proximity to the next exam shifts the kind of work.
 */
export function suggestPlan(data: AppData, energy: number): DayPlan {
  const exam = nextExam(data.exams);
  const days = exam ? daysUntil(exam.date) : undefined;
  const examBit = exam
    ? days === 0
      ? `${exam.name} is today — trust the work you've already done.`
      : `${exam.name} is in ${days} day${days === 1 ? "" : "s"}.`
    : "No exam on the horizon — this is maintenance, keep it light.";

  if (energy <= 2) {
    return {
      text:
        days !== undefined && days <= 7
          ? "Rough start. Do one 15-minute review of your weakest topic, then rest — a tired brain retains almost nothing from grinding."
          : "Running on empty. One 15-minute flashcard pass counts as a win today. Nothing else required.",
      meta: examBit,
    };
  }

  if (energy === 3) {
    return {
      text:
        days !== undefined && days <= 14
          ? "Steady day. One focused 45–60 minute block on the topic that scares you most, then stop while it still feels good."
          : "Decent energy. Aim for one solid 45-minute session — quality over hours.",
      meta: examBit,
    };
  }

  return {
    text:
      days !== undefined && days <= 30
        ? "You're firing today — spend it where it pays most: a full timed past paper, then a short review of what you missed."
        : "Strong start. Two deep 50-minute blocks with a real break between them. Push the hard material while it's cheap.",
    meta: examBit,
  };
}
