import { useEffect, useRef, useState } from "react";
import ScaleRow from "../components/ScaleRow";
import { today } from "../lib/dates";
import { saveSession, uid, useAppData } from "../store";

type Phase = "idle" | "running" | "paused" | "rate";

export default function Focus() {
  const data = useAppData();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState("");
  const [focus, setFocus] = useState<number | undefined>();
  const startedAt = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const start = () => {
    startedAt.current = Date.now();
    setSeconds(0);
    setPhase("running");
  };

  const finish = () => {
    if (focus === undefined) return;
    saveSession({
      id: uid(),
      date: today(),
      startedAt: startedAt.current,
      minutes: Math.max(1, Math.round(seconds / 60)),
      subject: subject.trim() || undefined,
      focus,
    });
    setPhase("idle");
    setSeconds(0);
    setSubject("");
    setFocus(undefined);
  };

  const todaySessions = data.sessions.filter((s) => s.date === today());
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);

  if (phase === "rate") {
    return (
      <div className="screen">
        <div className="eyebrow">Session over</div>
        <h1 className="screen-title">How did it go?</h1>
        <p className="screen-sub">
          {Math.max(1, Math.round(seconds / 60))} minutes. Rate the focus, not
          yourself.
        </p>

        <div className="section-label">Focus quality</div>
        <div className="card">
          <ScaleRow
            value={focus}
            labels={["scattered", "locked in"]}
            onChange={setFocus}
          />
          <div className="field">
            <label>Subject (optional)</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="math, physics, ielts…"
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary btn-block"
            disabled={focus === undefined}
            onClick={finish}
          >
            Save session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="eyebrow">Focus</div>
      <h1 className="screen-title">
        {phase === "idle" ? "Ready when you are." : "In session."}
      </h1>

      <div className="timer-wrap">
        <div className="timer-clock">
          {mm}:{ss}
        </div>
        <div className="timer-state">
          {phase === "idle" && "The timer just runs — no pressure, no targets."}
          {phase === "running" && "Recording quietly in the background."}
          {phase === "paused" && "Paused. Breaks are part of studying."}
        </div>

        <div className="timer-controls">
          {phase === "idle" && (
            <button className="btn btn-primary btn-block" onClick={start}>
              Start
            </button>
          )}
          {phase === "running" && (
            <>
              <button className="btn btn-quiet" onClick={() => setPhase("paused")}>
                Pause
              </button>
              <button className="btn btn-primary" onClick={() => setPhase("rate")}>
                End session
              </button>
            </>
          )}
          {phase === "paused" && (
            <>
              <button className="btn btn-quiet" onClick={() => setPhase("running")}>
                Resume
              </button>
              <button className="btn btn-primary" onClick={() => setPhase("rate")}>
                End session
              </button>
            </>
          )}
        </div>
      </div>

      {phase === "idle" && todaySessions.length > 0 && (
        <>
          <div className="section-label">Today so far</div>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">
                {todaySessions.length}
                <small> session{todaySessions.length === 1 ? "" : "s"}</small>
              </div>
              <div className="stat-label">completed</div>
            </div>
            <div className="stat">
              <div className="stat-value">
                {todayMinutes}
                <small> min</small>
              </div>
              <div className="stat-label">focused time</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
