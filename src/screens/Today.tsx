import { useState } from "react";
import ScaleRow from "../components/ScaleRow";
import { daysUntil, today, todayHeading } from "../lib/dates";
import { nextExam, suggestPlan } from "../lib/plan";
import { saveCheckin, useAppData } from "../store";
import type { Tab } from "../components/TabBar";

interface Props {
  go: (tab: Tab) => void;
}

export default function Today({ go }: Props) {
  const data = useAppData();
  const date = today();
  const checkin = data.checkins.find((c) => c.date === date);
  const loggedTonight = data.logs.some((l) => l.date === date);
  const exam = nextExam(data.exams);

  const [energy, setEnergy] = useState<number | undefined>(checkin?.energy);
  const [mood, setMood] = useState<number | undefined>(checkin?.mood);

  const pick = (e?: number, m?: number) => {
    setEnergy(e);
    setMood(m);
    if (e !== undefined && m !== undefined)
      saveCheckin({ date, energy: e, mood: m });
  };

  const plan = checkin ? suggestPlan(data, checkin.energy) : null;

  return (
    <div className="screen">
      <div className="eyebrow">{todayHeading()}</div>
      <h1 className="screen-title">
        {checkin ? "Here's your day." : "Good morning."}
      </h1>
      {exam && (
        <p className="screen-sub">
          {exam.name} in {daysUntil(exam.date)} days
        </p>
      )}

      {!checkin && (
        <>
          <div className="section-label">Two taps, that's it</div>
          <div className="card">
            <div className="card-title">How's your energy?</div>
            <ScaleRow
              value={energy}
              labels={["empty", "full"]}
              onChange={(v) => pick(v, mood)}
            />
            <div className="card-title" style={{ marginTop: 20 }}>
              And your mood?
            </div>
            <ScaleRow
              value={mood}
              labels={["low", "high"]}
              onChange={(v) => pick(energy, v)}
            />
          </div>
        </>
      )}

      {plan && (
        <>
          <div className="section-label">Today's suggestion</div>
          <div className="plan-card">
            <div className="plan-kicker">Based on how you're doing</div>
            <p className="plan-text">{plan.text}</p>
            <p className="plan-meta">{plan.meta}</p>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary btn-block" onClick={() => go("focus")}>
              Start a focus session
            </button>
          </div>
        </>
      )}

      <div className="section-label">Tonight</div>
      {loggedTonight ? (
        <div className="done-note">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.5l5 5L19.5 7" />
          </svg>
          Today is logged. Nothing else needed.
        </div>
      ) : (
        <div className="card">
          <div className="card-title">One messy sentence</div>
          <p className="card-sub">
            Before bed, dump how today went — sleep, food, mood, study. Thirty
            seconds, no structure needed.
          </p>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-quiet btn-block" onClick={() => go("log")}>
              Write tonight's log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
