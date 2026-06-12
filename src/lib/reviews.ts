import type { ISODate, Review } from "../types";
import { daysUntil, toISODate, today } from "./dates";
import { uid } from "./uid";

/**
 * Spacing of reviews after a study session, in days.
 * Roughly tracks the forgetting curve: review just before you'd forget.
 */
export const REVIEW_GAPS = [1, 3, 7, 21];

function plusDays(n: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** The first review of a freshly studied topic — tomorrow. */
export function firstReview(subject: string, topic?: string): Review {
  return {
    id: uid(),
    subject,
    topic,
    due: plusDays(REVIEW_GAPS[0]),
    step: 0,
    createdAt: Date.now(),
  };
}

/** The follow-up after completing a review, or null when the cycle is done. */
export function nextAfter(review: Review): Review | null {
  const step = review.step + 1;
  if (step >= REVIEW_GAPS.length) return null;
  return {
    id: uid(),
    subject: review.subject,
    topic: review.topic,
    due: plusDays(REVIEW_GAPS[step]),
    step,
    createdAt: Date.now(),
  };
}

/** Due (and overdue) reviews, oldest first. */
export function dueReviews(reviews: Review[]): Review[] {
  return reviews
    .filter((r) => daysUntil(r.due) <= 0)
    .sort((a, b) => a.due.localeCompare(b.due));
}

/** Tomorrow, for snoozing. */
export function snoozedDue(): ISODate {
  return plusDays(1);
}

export function reviewLabel(review: Review): string {
  return review.topic ? `${review.subject} — ${review.topic}` : review.subject;
}

/** "1st pass", "2nd pass"… */
export function passLabel(step: number): string {
  return ["1st", "2nd", "3rd", "4th"][step] + " pass";
}

/** Is this review overdue (was due before today)? */
export function isOverdue(review: Review): boolean {
  return review.due < today();
}
