import type { EveningLog, ISODate } from "../types";

/**
 * Local heuristic parser for the evening brain dump.
 * v1 runs entirely on-device; an LLM can replace this later behind the same
 * interface. The user always confirms the result, so being roughly right is
 * good enough.
 */

const SUBJECTS = [
  "computer science",
  "math",
  "maths",
  "physics",
  "chemistry",
  "chem",
  "biology",
  "bio",
  "english",
  "history",
  "geography",
  "economics",
  "econ",
  "ielts",
  "sat",
  "literature",
  "coding",
  "programming",
];

const MOOD_WORDS: Array<[RegExp, number]> = [
  [/\b(awful|terrible|horrible|depressed|burn(ed|t)? out|exhausted)\b/i, 1],
  [/\b(bad|tired|anxious|stressed|low|drained|rough)\b/i, 2],
  [/\b(ok(ay)?|fine|meh|average|normal|so-so)\b/i, 3],
  [/\b(good|solid|decent|productive|happy|calm)\b/i, 4],
  [/\b(great|amazing|excellent|fantastic|energi[sz]ed|focused)\b/i, 5],
];

interface Span {
  start: number;
  end: number;
  minutes: number;
  used: boolean;
}

function findSleep(text: string): { hours?: number; span?: [number, number] } {
  const m =
    text.match(
      /slept?\s+(?:for\s+|like\s+|about\s+|around\s+|only\s+)*(\d+(?:[.,]\d+)?)\s*(?:h(?:ours?|rs?)?\b)?/i
    ) ??
    text.match(/(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?\s+(?:of\s+)?sleep/i) ??
    text.match(
      /sleep\s+(?:was\s+|maybe\s+|like\s+|about\s+|around\s+|only\s+)*(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?\b/i
    );
  if (!m || m.index === undefined) return {};
  const hours = parseFloat(m[1].replace(",", "."));
  if (!(hours > 0 && hours <= 16)) return {};
  return { hours, span: [m.index, m.index + m[0].length] };
}

/** All duration mentions ("2h", "40 min", "1.5 hours") with positions. */
function findDurations(text: string, exclude?: [number, number]): Span[] {
  const spans: Span[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(h(?:ours?|rs?)?|m(?:in(?:ute)?s?)?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (exclude && start < exclude[1] && end > exclude[0]) continue;
    const value = parseFloat(m[1].replace(",", "."));
    const minutes = m[2].toLowerCase().startsWith("h")
      ? Math.round(value * 60)
      : Math.round(value);
    spans.push({ start, end, minutes, used: false });
  }
  // merge adjacent "2h 30m" pairs
  for (let i = 0; i < spans.length - 1; i++) {
    const gap = text.slice(spans[i].end, spans[i + 1].start);
    if (/^[\s,]{0,3}$/.test(gap)) {
      spans[i].minutes += spans[i + 1].minutes;
      spans[i].end = spans[i + 1].end;
      spans.splice(i + 1, 1);
    }
  }
  return spans;
}

function canonicalSubject(s: string): string {
  const map: Record<string, string> = {
    maths: "math",
    chem: "chemistry",
    bio: "biology",
    econ: "economics",
    coding: "computer science",
    programming: "computer science",
  };
  return map[s] ?? s;
}

function parseStudied(
  text: string,
  sleepSpan?: [number, number]
): Record<string, number> {
  const studied: Record<string, number> = {};
  const durations = findDurations(text, sleepSpan);

  // find each subject as a whole word, then pair it with the nearest
  // unclaimed duration within ~30 characters
  const mentions: Array<{ subject: string; start: number; end: number }> = [];
  for (const subject of SUBJECTS) {
    const re = new RegExp(`\\b${subject.replace(" ", "\\s+")}\\b`, "i");
    const m = re.exec(text);
    if (m) mentions.push({ subject, start: m.index, end: m.index + m[0].length });
  }
  // closer pairs claim their duration first
  const pairs = mentions
    .flatMap((mention) =>
      durations.map((d) => ({
        mention,
        d,
        dist: Math.max(mention.start - d.end, d.start - mention.end, 0),
      }))
    )
    .filter((p) => p.dist <= 30)
    .sort((a, b) => a.dist - b.dist);

  const claimed = new Set<string>();
  for (const { mention, d } of pairs) {
    if (d.used || claimed.has(mention.subject)) continue;
    d.used = true;
    claimed.add(mention.subject);
    studied[canonicalSubject(mention.subject)] = d.minutes;
  }
  // subjects mentioned without a duration still count as studied
  for (const mention of mentions) {
    const key = canonicalSubject(mention.subject);
    if (!(key in studied)) studied[key] = 0;
  }
  return studied;
}

function parseMood(text: string): number | undefined {
  for (const [re, score] of MOOD_WORDS) {
    if (re.test(text)) return score;
  }
  return undefined;
}

export function parseBrainDump(raw: string, date: ISODate): EveningLog {
  const sleep = findSleep(raw);
  return {
    date,
    raw,
    sleepHours: sleep.hours,
    mood: parseMood(raw),
    studied: parseStudied(raw, sleep.span),
    note: raw.trim() || undefined,
  };
}
