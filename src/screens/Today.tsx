import { useState } from "react";
import Ring from "../components/Ring";
import ScaleRow from "../components/ScaleRow";
import type { Tab } from "../components/TabBar";
import { daysUntil, today, todayHeading } from "../lib/dates";
import { nextExam, suggestPlan } from "../lib/plan";
import { dueReviews, isOverdue, passLabel } from "../lib/reviews";
import { completeReview, saveCheckin, snoozeReview, useAppData } from "../store";

const ENERGY = ["🪫", "😮‍💨", "😐", "🙂", "⚡"];
const MOOD = ["😖", "😕", "😐", "🙂", "😄"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late.";
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

interface Props {
  go: (tab: Tab) => void;
}

export default function Today({ go }: Props) {
  const data = useAppData();
  const date = today();
  const checkin = data.checkins.find((c) => c.date === date);
  const loggedTonight = data.logs.some((l) => l.date === date);
  const exam = nextExam(data.exams);
  const due = dueReviews(data.reviews);

  const [energy, setEnergy] = useState<number | undefined>(checkin?.energy);
  const [mood, setMood] = useState<number | undefined>(checkin?.mood);

  const pick = (e?: number, m?: number) => {
    setEnergy(e);
    setMood(m);
    if (e !== undefined && m !== undefined)
      saveCheckin({ date, energy: e, mood: m });
  };

  const plan = checkin ? suggestPlan(data, checkin.energy) : null;

  const todaySessions = data.sessions.filter((s) => s.date === date);
  const minutes = todaySessions.reduce((a, s) => a + s.minutes, 0);
  const goal = data.settings.dailyGoalMin;

  return (
    <div className="screen">
      <header className="hero">
        <div>
          <div className="eyebrow">{todayHeading()}</div>
          <h1 className="screen-title">{greeting()}</h1>
          {exam && (
            <button className="exam-pill" onClick={() => go("exams")}>
              🎯 {exam.name} in {daysUntil(exam.date)}d
            </button>
          )}
        </div>
        <div className="glass glass-chip ring-chip" onClick={() => go("focus")}>
          <Ring progress={goal ? minutes / goal : 0} />
          <div className="ring-text">
            <strong>{minutes}</strong>
            <span>of {goal}m</span>
          </div>
        </div>
      </header>

      {!checkin && (
        <section className="card card-checkin">
          <div className="card-title">Quick check-in</div>
          <p className="card-sub">Two taps — the day plan adapts to it.</p>
          <div className="check-label">Energy</div>
          <ScaleRow
            value={energy}
            emojis={ENERGY}
            labels={["empty", "charged"]}
            onChange={(v) => pick(v, mood)}
          />
          <div className="check-label">Mood</div>
          <ScaleRow
            value={mood}
            emojis={MOOD}
            labels={["rough", "great"]}
            onChange={(v) => pick(energy, v)}
          />
        </section>
      )}

      {plan && (
        <section className="card-dark">
          <div className="kicker kicker-orange">Today's move</div>
          <p className="plan-text">{plan.text}</p>
          <div className="card-dark-foot">
            <span className="plan-meta">{plan.meta}</span>
            <button
              className="round-btn"
              aria-label="Start a focus session"
              onClick={() => go("focus")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M13 6.5L18.5 12 13 17.5" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {due.length > 0 && (
        <>
          <div className="section-label">
            Memory check — about to fade
            <span className="count-bubble">{due.length}</span>
          </div>
          {due.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-info">
                <div className="review-name">
                  <span className="cap">{r.subject}</span>
                  {r.topic && <span className="review-topic"> · {r.topic}</span>}
                </div>
                <div className="review-meta">
                  {passLabel(r.step)}
                  {isOverdue(r) && <span className="overdue"> · overdue</span>}
                </div>
              </div>
              <div className="review-actions">
                <button
                  className="btn-pill btn-pill-quiet"
                  onClick={() => snoozeReview(r.id)}
                >
                  Later
                </button>
                <button
                  className="btn-pill btn-pill-dark"
                  onClick={() => completeReview(r.id)}
                >
                  Reviewed ✓
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="tile-grid">
        <div className="tile tile-peach">
          <div className="tile-value">{todaySessions.length}</div>
          <div className="tile-label">
            session{todaySessions.length === 1 ? "" : "s"} today
          </div>
        </div>
        <div className="tile tile-lavender">
          <div className="tile-value">
            {minutes >= 60
              ? `${Math.floor(minutes / 60)}h ${minutes % 60 ? (minutes % 60) + "m" : ""}`
              : `${minutes}m`}
          </div>
          <div className="tile-label">deep work</div>
        </div>
      </div>

      <div className="section-label">Tonight</div>
      {loggedTonight ? (
        <div className="done-note">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.5l5 5L19.5 7" />
          </svg>
          Today is logged. Nothing else needed.
        </div>
      ) : (
        <section className="card">
          <div className="card-title">One messy sentence</div>
          <p className="card-sub">
            Before bed, dump how today went — sleep, food, mood, study. Thirty
            seconds, no structure needed.
          </p>
          <button
            className="btn btn-quiet btn-block"
            style={{ marginTop: 14 }}
            onClick={() => go("log")}
          >
            Write tonight's log
          </button>
        </section>
      )}
    </div>
  );
}
