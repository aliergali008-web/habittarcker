import { useEffect, useMemo, useRef, useState } from "react";
import ScaleRow from "../components/ScaleRow";
import { today } from "../lib/dates";
import { firstReview } from "../lib/reviews";
import { addReview, saveSession, uid, useAppData } from "../store";

type Phase = "idle" | "running" | "paused" | "rate";

export default function Focus() {
  const data = useAppData();
  const [phase, setPhase] = useState<Phase>("idle");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [focus, setFocus] = useState<number | undefined>();
  const [slips, setSlips] = useState(0);
  const [scheduleReviews, setScheduleReviews] = useState(true);

  // drift-free clock: accumulate real elapsed time across pauses
  const startedAt = useRef(0);
  const accumulated = useRef(0);
  const resumedAt = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (phase !== "running") return;
    const tick = () =>
      setElapsedMs(
        accumulated.current +
          (resumedAt.current !== null ? Date.now() - resumedAt.current : 0)
      );
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [phase]);

  // the honest version of "screen time control" a web app can offer:
  // count every time attention leaves the app mid-session
  useEffect(() => {
    if (phase !== "running") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") setSlips((s) => s + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  // keep the screen awake during a session, where supported
  useEffect(() => {
    if (phase !== "running" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [phase]);

  const seconds = Math.floor(elapsedMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const recentSubjects = useMemo(() => {
    const seen: string[] = [];
    for (const s of [...data.sessions].reverse()) {
      const name = s.subject?.trim();
      if (name && !seen.some((x) => x.toLowerCase() === name.toLowerCase()))
        seen.push(name);
      if (seen.length >= 4) break;
    }
    return seen;
  }, [data.sessions]);

  const start = () => {
    startedAt.current = Date.now();
    accumulated.current = 0;
    resumedAt.current = Date.now();
    setElapsedMs(0);
    setSlips(0);
    setPhase("running");
  };

  const pause = () => {
    if (resumedAt.current !== null)
      accumulated.current += Date.now() - resumedAt.current;
    resumedAt.current = null;
    setElapsedMs(accumulated.current);
    setPhase("paused");
  };

  const resume = () => {
    resumedAt.current = Date.now();
    setPhase("running");
  };

  const end = () => {
    if (resumedAt.current !== null)
      accumulated.current += Date.now() - resumedAt.current;
    resumedAt.current = null;
    setElapsedMs(accumulated.current);
    setPhase("rate");
  };

  const finish = () => {
    if (focus === undefined) return;
    const name = subject.trim();
    saveSession({
      id: uid(),
      date: today(),
      startedAt: startedAt.current,
      minutes: Math.max(1, Math.round(accumulated.current / 60_000)),
      subject: name || undefined,
      focus,
      slips,
    });
    if (scheduleReviews && name)
      addReview(firstReview(name, topic.trim() || undefined));
    setPhase("idle");
    accumulated.current = 0;
    setElapsedMs(0);
    setSubject("");
    setTopic("");
    setFocus(undefined);
    setSlips(0);
  };

  const todaySessions = data.sessions.filter((s) => s.date === today());
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);

  if (phase === "rate") {
    return (
      <div className="screen">
        <div className="eyebrow">Session over</div>
        <h1 className="screen-title">How did it go?</h1>
        <p className="screen-sub">
          {Math.max(1, Math.round(elapsedMs / 60_000))} minutes
          {slips > 0
            ? ` · drifted away ${slips} time${slips === 1 ? "" : "s"}`
            : " · no slips, locked in"}
        </p>

        <section className="card">
          <div className="card-title">Focus quality</div>
          <ScaleRow
            value={focus}
            labels={["scattered", "locked in"]}
            onChange={setFocus}
          />
          {subject.trim() !== "" && (
            <label className="toggle-row">
              <span>
                <strong>Schedule memory checks</strong>
                <small>resurfaces {subject.trim()} in 1, 3, 7 and 21 days</small>
              </span>
              <button
                role="switch"
                aria-checked={scheduleReviews}
                className={`switch ${scheduleReviews ? "on" : ""}`}
                onClick={() => setScheduleReviews((v) => !v)}
              >
                <span className="knob" />
              </button>
            </label>
          )}
        </section>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={focus === undefined}
          onClick={finish}
        >
          Save session
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="eyebrow">Focus</div>
      <h1 className="screen-title">
        {phase === "idle" ? "Ready when you are." : "In session."}
      </h1>

      {phase === "idle" && (
        <section className="card">
          <div className="card-title">What are you sitting down with?</div>
          {recentSubjects.length > 0 && (
            <div className="chip-row" style={{ marginTop: 12 }}>
              {recentSubjects.map((s) => (
                <button
                  key={s}
                  className={`chip ${subject.trim().toLowerCase() === s.toLowerCase() ? "chip-on" : ""}`}
                  onClick={() => setSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="field">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject — math, physics, ielts…"
            />
          </div>
          <div className="field" style={{ marginTop: 8 }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (optional) — integration by parts…"
            />
          </div>
        </section>
      )}

      <div className={`glass timer-glass ${phase !== "idle" ? "live" : ""}`}>
        <div className="timer-clock">
          {mm}:{ss}
        </div>
        <div className="timer-state">
          {phase === "idle" && "No targets, no pressure — it just runs."}
          {phase === "running" &&
            (slips === 0
              ? "Locked in. Leaving the app counts as a slip."
              : `${slips} slip${slips === 1 ? "" : "s"} so far — it's data, not guilt.`)}
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
              <button className="btn btn-quiet" onClick={pause}>
                Pause
              </button>
              <button className="btn btn-dark" onClick={end}>
                End session
              </button>
            </>
          )}
          {phase === "paused" && (
            <>
              <button className="btn btn-quiet" onClick={resume}>
                Resume
              </button>
              <button className="btn btn-dark" onClick={end}>
                End session
              </button>
            </>
          )}
        </div>
      </div>

      {phase === "idle" && todaySessions.length > 0 && (
        <div className="tile-grid" style={{ marginTop: 16 }}>
          <div className="tile tile-mint">
            <div className="tile-value">{todaySessions.length}</div>
            <div className="tile-label">
              session{todaySessions.length === 1 ? "" : "s"} done
            </div>
          </div>
          <div className="tile tile-butter">
            <div className="tile-value">{todayMinutes}m</div>
            <div className="tile-label">focused today</div>
          </div>
        </div>
      )}
    </div>
  );
}
