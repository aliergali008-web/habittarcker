import { useEffect } from "react";
import { daysAgo, today } from "../lib/dates";
import { maybeGenerateInsight } from "../lib/insights";
import {
  goldenWindow,
  hourBuckets,
  monthMood,
  neglectedSubject,
  subjectStats,
  weekSlips,
} from "../lib/stats";
import {
  addInsight,
  exportData,
  resolveInsight,
  setDailyGoal,
  useAppData,
} from "../store";

const MOOD_FACES = ["😖", "😕", "😐", "🙂", "😄"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Insights() {
  const data = useAppData();

  // The engine only speaks when it has enough data, at most once a week.
  useEffect(() => {
    const insight = maybeGenerateInsight(data);
    if (insight) addInsight(insight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last30 = Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
  const loggedDates = new Set(data.logs.map((l) => l.date));
  const sessionDates = new Set(data.sessions.map((s) => s.date));
  const loggedCount = last30.filter((d) => loggedDates.has(d)).length;

  const weekDates = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i)));
  const weekSessions = data.sessions.filter((s) => weekDates.has(s.date));
  const weekMinutes = weekSessions.reduce((a, s) => a + s.minutes, 0);
  const slips = weekSlips(data.sessions);

  const mood = monthMood(data);
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const last14 = new Set(Array.from({ length: 14 }, (_, i) => daysAgo(i)));
  const recentSessions = data.sessions.filter((s) => last14.has(s.date));
  const buckets = hourBuckets(recentSessions);
  const golden = goldenWindow(buckets);
  const maxMin = Math.max(...buckets.map((b) => b.minutes), 1);
  const hasHourData = buckets.some((b) => b.minutes > 0);

  const subjects = subjectStats(data);
  const neglected = neglectedSubject(subjects);
  const maxSubjectMin = Math.max(...subjects.map((s) => s.recentMin), 1);

  const open = data.insights.find((i) => i.status === "open");

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studytracker-export-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screen">
      <div className="eyebrow">Insights</div>
      <h1 className="screen-title">What the days add up to.</h1>

      <div className="section-label">Mood — {monthName}</div>
      <section className="card">
        <div className="mood-grid">
          {WEEKDAYS.map((d, i) => (
            <div key={`h${i}`} className="mood-head">
              {d}
            </div>
          ))}
          {Array.from({ length: mood.blanks }, (_, i) => (
            <div key={`b${i}`} />
          ))}
          {mood.cells.map((c) => (
            <div
              key={c.date}
              className={`mood-cell ${c.mood ? `m${c.mood}` : ""} ${c.future ? "future" : ""} ${c.date === today() ? "today" : ""}`}
            >
              {c.mood ? MOOD_FACES[c.mood - 1] : ""}
            </div>
          ))}
        </div>
      </section>

      {open && (
        <>
          <div className="section-label">A question, not a verdict</div>
          <section className="insight-card">
            <div className="kicker kicker-lavender">Pattern noticed</div>
            <p className="insight-question">{open.question}</p>
            <div className="insight-actions">
              <button
                className="btn-pill btn-pill-dark"
                onClick={() => resolveInsight(open.id, "confirmed")}
              >
                Rings true
              </button>
              <button
                className="btn-pill btn-pill-quiet"
                onClick={() => resolveInsight(open.id, "dismissed")}
              >
                Not really
              </button>
            </div>
          </section>
        </>
      )}

      <div className="section-label">Golden hours — last 14 days</div>
      <section className="card-dark">
        {hasHourData ? (
          <>
            <div className="kicker kicker-orange">
              {golden
                ? `You focus best around ${golden.label} — guard that window`
                : "When your focused minutes land"}
            </div>
            <div className="bars">
              {buckets.map((b, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${golden && b === golden ? "best" : ""}`}
                      style={{ height: `${Math.max(6, (b.minutes / maxMin) * 100)}%` }}
                    >
                      {b.minutes > 0 && (
                      <span>
                        {b.minutes >= 90
                          ? `${Math.round(b.minutes / 60)}h`
                          : `${b.minutes}m`}
                      </span>
                    )}
                    </div>
                  </div>
                  <div className="bar-label">
                    {b.label}
                    <small>{i < 2 ? "am" : "pm"}</small>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="plan-text" style={{ fontSize: 16 }}>
            Run a few focus sessions and this chart shows which hours your
            brain actually works — then you can stop scheduling hard subjects
            against it.
          </p>
        )}
      </section>

      {subjects.length > 0 && (
        <>
          <div className="section-label">Subjects — last 14 days</div>
          <section className="card">
            {neglected && (
              <div className="neglect-note">
                ⚠️ You haven't touched <strong>{neglected.subject}</strong> in{" "}
                {neglected.daysSince} days. Avoiding it won't make it easier.
              </div>
            )}
            {subjects.map((s) => (
              <div className="subject-row" key={s.subject}>
                <span className="subject-name">{s.subject}</span>
                <div className="subject-track">
                  <div
                    className="subject-fill"
                    style={{ width: `${Math.max(4, (s.recentMin / maxSubjectMin) * 100)}%` }}
                  />
                </div>
                <span className="subject-min">
                  {s.recentMin >= 60
                    ? `${(s.recentMin / 60).toFixed(s.recentMin % 60 ? 1 : 0)}h`
                    : `${s.recentMin}m`}
                </span>
              </div>
            ))}
          </section>
        </>
      )}

      <div className="section-label">This week</div>
      <div className="tile-grid">
        <div className="tile tile-peach">
          <div className="tile-value">
            {weekMinutes >= 60 ? `${(weekMinutes / 60).toFixed(1)}h` : `${weekMinutes}m`}
          </div>
          <div className="tile-label">deep work</div>
        </div>
        <div className="tile tile-lavender">
          <div className="tile-value">{slips.slips}</div>
          <div className="tile-label">
            focus slips in {slips.tracked} session{slips.tracked === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="section-label">Consistency — no streaks, just density</div>
      <section className="card">
        <div className="density-headline">
          <em>{loggedCount}</em> of the last 30 days logged
        </div>
        <div className="density-grid">
          {last30.map((d) => (
            <div
              key={d}
              className={[
                "density-cell",
                loggedDates.has(d)
                  ? "logged"
                  : sessionDates.has(d)
                    ? "partial"
                    : "",
                d === today() ? "today" : "",
              ].join(" ")}
            />
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12 }}>
          Missed days are just empty — they don't reset anything.
        </p>
      </section>

      <div className="section-label">Daily goal</div>
      <section className="card goal-card">
        <div>
          <div className="card-title">{data.settings.dailyGoalMin} min</div>
          <p className="card-sub">of focused work per day</p>
        </div>
        <div className="stepper">
          <button
            aria-label="Lower goal"
            onClick={() =>
              setDailyGoal(Math.max(30, data.settings.dailyGoalMin - 15))
            }
          >
            −
          </button>
          <button
            aria-label="Raise goal"
            onClick={() =>
              setDailyGoal(Math.min(360, data.settings.dailyGoalMin + 15))
            }
          >
            +
          </button>
        </div>
      </section>

      <div className="section-label">Your data</div>
      <button className="btn btn-quiet btn-block" onClick={download}>
        Download everything as JSON
      </button>
    </div>
  );
}
