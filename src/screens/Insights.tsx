import { useEffect } from "react";
import { daysAgo, today } from "../lib/dates";
import { maybeGenerateInsight } from "../lib/insights";
import { addInsight, exportData, resolveInsight, useAppData } from "../store";

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
  const weekLogs = data.logs.filter((l) => weekDates.has(l.date));
  const weekSessions = data.sessions.filter((s) => weekDates.has(s.date));
  const weekMinutes = weekSessions.reduce((a, s) => a + s.minutes, 0);
  const sleeps = weekLogs
    .map((l) => l.sleepHours)
    .filter((h): h is number => h !== undefined);
  const avgSleep = sleeps.length
    ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1)
    : "—";
  const focuses = weekSessions
    .map((s) => s.focus)
    .filter((f): f is number => f !== undefined);
  const avgFocus = focuses.length
    ? (focuses.reduce((a, b) => a + b, 0) / focuses.length).toFixed(1)
    : "—";

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
      <h1 className="screen-title">Your last 30 days.</h1>

      <div className="section-label">Consistency — no streaks, just density</div>
      <div className="card">
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
      </div>

      {open && (
        <>
          <div className="section-label">A question, not a verdict</div>
          <div className="insight-card">
            <div className="insight-kicker">Pattern noticed</div>
            <p className="insight-question">{open.question}</p>
            <div className="insight-actions">
              <button
                className="btn btn-primary"
                onClick={() => resolveInsight(open.id, "confirmed")}
              >
                Rings true
              </button>
              <button
                className="btn btn-quiet"
                onClick={() => resolveInsight(open.id, "dismissed")}
              >
                Not really
              </button>
            </div>
          </div>
        </>
      )}

      <div className="section-label">This week</div>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">
            {weekLogs.length}
            <small> of 7</small>
          </div>
          <div className="stat-label">evenings logged</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {weekMinutes}
            <small> min</small>
          </div>
          <div className="stat-label">focused study</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {avgSleep}
            <small>{avgSleep !== "—" ? " h" : ""}</small>
          </div>
          <div className="stat-label">avg sleep</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {avgFocus}
            <small>{avgFocus !== "—" ? " / 5" : ""}</small>
          </div>
          <div className="stat-label">avg focus</div>
        </div>
      </div>

      {!open && data.logs.length < 8 && (
        <div className="empty-state">
          <div className="empty-title">Patterns take a little time.</div>
          Keep logging — after about a week of evenings, this page starts
          asking better questions.
        </div>
      )}

      <div className="section-label">Your data</div>
      <button className="btn btn-quiet btn-block" onClick={download}>
        Download everything as JSON
      </button>
    </div>
  );
}
