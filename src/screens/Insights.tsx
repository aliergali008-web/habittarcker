import { useEffect } from "react";
import { Squiggle } from "../components/Doodles";
import Face from "../components/Face";
import { daysAgo, today } from "../lib/dates";
import { maybeGenerateInsight } from "../lib/insights";
import { focusScore } from "../lib/score";
import {
  goldenWindow,
  hourBuckets,
  monthMood,
  neglectedSubject,
  subjectStats,
  weekSlips,
} from "../lib/stats";
import { shareWrapped } from "../lib/wrapped";
import {
  addInsight,
  exportData,
  resolveInsight,
  setDailyGoal,
  useAppData,
} from "../store";

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
  const score = focusScore(data);

  const mood = monthMood(data);
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
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

      <section className="score-block">
        <div>
          <div className="score-big">
            {score ? score.score : "—"}
            <span className="score-cap">/100</span>
          </div>
          <Squiggle />
          <div className="score-label">focus score, last 7 days</div>
        </div>
        <button
          className="btn btn-dark wrapped-btn"
          onClick={() => shareWrapped(data, data.settings.name)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" />
            <path d="M4.5 14.5v4a2 2 0 002 2h11a2 2 0 002-2v-4" />
          </svg>
          Share my week
        </button>
      </section>

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
              {c.mood && <Face v={c.mood} size={20} />}
            </div>
          ))}
        </div>
      </section>

      {open && (
        <>
          <div className="section-label">A question, not a verdict</div>
          <section className="insight-card">
            <div className="kicker kicker-deep">Pattern noticed</div>
            <p className="insight-question">{open.question}</p>
            <div className="insight-actions">
              <button
                className="btn-pill btn-pill-dark"
                onClick={() => resolveInsight(open.id, "confirmed")}
              >
                Rings true
              </button>
              <button
                className="btn-pill btn-pill-light"
                onClick={() => resolveInsight(open.id, "dismissed")}
              >
                Not really
              </button>
            </div>
          </section>
        </>
      )}

      <div className="section-label">Golden hours — last 14 days</div>
      <section className="card">
        {hasHourData ? (
          <>
            <div className="card-title" style={{ fontSize: 17 }}>
              {golden
                ? `You focus best around ${golden.label} — guard that window.`
                : "When your focused minutes land"}
            </div>
            <div className="bars">
              {buckets.map((b, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar-track">
                    {b.minutes > 0 && (
                      <div className="bar-value">
                        {b.minutes >= 90
                          ? `${Math.round(b.minutes / 60)}h`
                          : b.minutes}
                      </div>
                    )}
                    <div
                      className={`bar-fill ${golden && b === golden ? "best" : ""}`}
                      style={{ height: `${Math.max(7, (b.minutes / maxMin) * 100)}%` }}
                    />
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
          <p className="card-sub" style={{ fontSize: 15 }}>
            Run a few focus sessions and this chart shows which hours your
            brain actually works — then stop scheduling hard subjects against
            it.
          </p>
        )}
      </section>

      {subjects.length > 0 && (
        <>
          <div className="section-label">Subjects — last 14 days</div>
          <section className="card">
            {neglected && (
              <div className="neglect-note">
                You haven't touched <strong className="cap">{neglected.subject}</strong>{" "}
                in {neglected.daysSince} days. Avoiding it won't make it easier.
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
        <div className="tile tile-mint tile-blob-a">
          <div className="tile-value">
            {weekMinutes >= 60 ? `${(weekMinutes / 60).toFixed(1)}h` : `${weekMinutes}m`}
          </div>
          <div className="tile-label">deep work</div>
        </div>
        <div className="tile tile-butter tile-blob-b">
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
