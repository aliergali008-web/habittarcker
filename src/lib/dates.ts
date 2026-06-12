import type { ISODate } from "../types";

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): ISODate {
  return toISODate(new Date());
}

export function daysAgo(n: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function daysUntil(date: ISODate): number {
  const target = new Date(date + "T00:00:00");
  const now = new Date(today() + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function prettyDate(date: ISODate): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function todayHeading(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
