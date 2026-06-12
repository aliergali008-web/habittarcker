/**
 * Seeds demo data into localStorage and captures iPhone-sized screenshots
 * of every screen. Run `npm run preview` first, then:
 *   node scripts/screenshot.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.URL ?? "http://localhost:4173";
const OUT = "shots";

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const at = (n, h, m = 0) => {
  const d = dAgo(n);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
let n = 0;
const uid = () => `demo${(n++).toString(36).padStart(4, "0")}`;

function demoData() {
  const sessions = [];
  const session = (ago, h, minutes, subject, focus, slips) =>
    sessions.push({
      id: uid(),
      date: iso(dAgo(ago)),
      startedAt: at(ago, h),
      minutes,
      subject,
      focus,
      slips,
    });

  // today: 90 of the 120-minute goal
  session(0, 9, 50, "math", 5, 0);
  session(0, 14, 40, "ielts", 4, 1);

  for (let i = 1; i <= 14; i++) {
    session(i, i % 2 ? 9 : 10, 45 + ((i * 7) % 25), i % 2 ? "math" : "physics", i % 3 === 0 ? 4 : 5, i % 4 === 0 ? 1 : 0);
    if (i % 2 === 0) session(i, 14 + (i % 2), 30 + ((i * 5) % 20), "ielts", 3, 1);
    if (i % 3 === 0) session(i, 20, 35, i % 2 ? "physics" : "math", 2 + (i % 2), 2 + (i % 3));
  }

  const logs = [];
  const sleeps = [7, 6.5, 8, 5.5, 7.5, 6, 8, 7, 5, 7.5, 6.5, 8, 7, 6, 7.5, 8, 6.5, 7, 7.5];
  for (let i = 1; i <= 19; i++) {
    if ([3, 8, 13].includes(i)) continue; // honest gaps
    const studied = { math: 60 + ((i * 13) % 60), physics: 40 + ((i * 7) % 50) };
    if (i >= 9 && i % 3 === 0) studied.chemistry = 45;
    if (i % 2 === 0) studied.ielts = 35;
    logs.push({
      date: iso(dAgo(i)),
      raw: `slept ${sleeps[i]}h, did ${Math.round(studied.math / 30) / 2}h of math past papers, some physics, felt ok`,
      sleepHours: sleeps[i],
      mood: sleeps[i] >= 7 ? 4 + (i % 2) : 2 + (i % 2),
      studied,
    });
  }

  const checkins = [];
  for (let i = 1; i <= 19; i++)
    checkins.push({
      date: iso(dAgo(i)),
      energy: 2 + ((i * 3) % 4),
      mood: 2 + ((i * 5) % 4),
    });

  const plusDays = (k) => iso(dAgo(-k));
  return {
    logs,
    checkins,
    sessions,
    exams: [
      { id: uid(), name: "IELTS", date: plusDays(9), subject: "ielts" },
      { id: uid(), name: "A-Level Chemistry", date: plusDays(24), subject: "chemistry" },
    ],
    reviews: [
      { id: uid(), subject: "math", topic: "Integration by parts", due: iso(dAgo(0)), step: 1, createdAt: Date.now() - 3 * 86400000 },
      { id: uid(), subject: "physics", topic: "Circular motion", due: iso(dAgo(1)), step: 0, createdAt: Date.now() - 2 * 86400000 },
      { id: uid(), subject: "ielts", topic: "Essay structures", due: plusDays(3), step: 2, createdAt: Date.now() - 8 * 86400000 },
    ],
    insights: [
      {
        id: uid(),
        question:
          "Your focus after nights under 6 hours of sleep averages 2.4/5, but 4.1/5 after longer nights. Notice anything?",
        status: "open",
        createdAt: Date.now() - 86400000,
      },
    ],
    settings: { dailyGoalMin: 120, name: "Ali" },
  };
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
// mid-afternoon, so the greeting and "today's" sessions read naturally
const now = new Date();
await page.clock.setSystemTime(
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30)
);
const seed = JSON.stringify(demoData());
await page.addInitScript(
  ([key, value]) => localStorage.setItem(key, value),
  ["studytracker.v1", seed]
);

const shot = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}`);
};
const tab = (label) => page.click(`nav [aria-label="${label}"]`);

await page.goto(BASE);
await page.waitForSelector(".hello");
await shot("01-today-checkin");

// fill the morning check-in → plan card appears
const dots = page.locator(".scale-row").first().locator(".scale-dot");
await dots.nth(3).click();
await page.locator(".scale-row").nth(1).locator(".scale-dot").nth(4).click();
await shot("02-today-plan");

await tab("Focus");
await page.click('.chip:has-text("math")');
await shot("03-focus");
await page.click('button:has-text("Start")');
await page.waitForTimeout(2600);
await page.screenshot({ path: `${OUT}/04-focus-live.png` });
console.log("✓ 04-focus-live");
await page.click('button:has-text("End session")');
await page.locator(".scale-row .scale-dot").nth(4).click();
await shot("05-focus-rate");

await tab("Insights");
await shot("06-insights-mood");

// the Wrapped card downloads as a PNG in headless (no share sheet)
const dl = page.waitForEvent("download");
await page.click('button:has-text("Share my week")');
await (await dl).saveAs(`${OUT}/12-wrapped.png`);
console.log("✓ 12-wrapped");
await page.locator(".bars").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 170));
await shot("07-insights-hours");
await page.locator(".density-grid").scrollIntoViewIfNeeded();
await shot("08-insights-consistency");

await tab("Exams");
await shot("09-exams");

await tab("Evening log");
await page.fill(
  ".dump-box",
  "slept 7h, did 2h of math past papers and 45m physics, skipped lunch, felt pretty good"
);
await shot("10-log");
await page.click('button:has-text("Done")');
await shot("11-log-parsed");

await browser.close();
console.log("done");
