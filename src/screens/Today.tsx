import { useState } from "react";
import Avatar from "../components/Avatar";
import { Bolt, Trophy } from "../components/Doodles";
import Ring from "../components/Ring";
import ScaleRow from "../components/ScaleRow";
import type { Tab } from "../components/TabBar";
import { daysUntil, today, todayHeading } from "../lib/dates";
import { nextExam, suggestPlan } from "../lib/plan";
import { dueReviews, isOverdue, passLabel } from "../lib/reviews";
import { focusScore } from "../lib/score";
import {
  completeReview,
  saveCheckin,
  setName,
  snoozeReview,
  useAppData,
} from "../store";

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
  const score = focusScore(data);

  const [energy, setEnergy] = useState<number | undefined>(checkin?.energy);
  const [mood, setMood] = useState<number | undefined>(checkin?.mood);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(data.settings.name ?? "");

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
        <div className="hero-id">
          <Avatar />
          <div>
            {editingName ? (
              <form
                className="name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setName(draftName);
                  setEditingName(false);
                }}
              >
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Your name"
                />
                <button type="submit" className="btn-pill btn-pill-dark">
                  Save
                </button>
              </form>
            ) : (
              <h1 className="hello" onClick={() => setEditingName(true)}>
                Hello{data.settings.name ? `, ${data.settings.name}` : " there"}
              </h1>
            )}
            <div className="hero-score">
              <Bolt />
              {score
                ? `Focus score: ${score.score}`
                : "Let's build your focus score"}
            </div>
          </div>
        </div>
        <button className="glass glass-chip ring-chip" onClick={() => go("focus")}>
          <Ring progress={goal ? minutes / goal : 0} />
          <div className="ring-text">
            <strong>{minutes}</strong>
            <span>of {goal}m</span>
          </div>
        </button>
      </header>

      <div className="date-row">
        <span className="eyebrow">{todayHeading()}</span>
        {exam && (
          <button className="exam-pill" onClick={() => go("exams")}>
            {exam.name} in {daysUntil(exam.date)}d
          </button>
        )}
      </div>

      {!checkin && (
        <section className="card card-checkin">
          <div className="card-title">How are you landing today?</div>
          <p className="card-sub">Two taps — the day plan adapts to it.</p>
          <div className="check-label">Energy</div>
          <ScaleRow
            value={energy}
            labels={["empty", "charged"]}
            onChange={(v) => pick(v, mood)}
          />
          <div className="check-label">Mood</div>
          <ScaleRow
            value={mood}
            labels={["rough", "great"]}
            onChange={(v) => pick(energy, v)}
          />
        </section>
      )}

      {plan && (
        <section className="hero-card">
          <div className="hero-card-text">
            <div className="kicker kicker-deep">Today's move</div>
            <p className="plan-text">{plan.text}</p>
          </div>
          <div className="hero-card-art">
            <Trophy />
          </div>
          <div className="hero-card-foot">
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
        <div className="tile tile-peach tile-blob-a">
          <div className="tile-value">{todaySessions.length}</div>
          <div className="tile-label">
            session{todaySessions.length === 1 ? "" : "s"} today
          </div>
        </div>
        <div className="tile tile-lavender tile-blob-b">
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
