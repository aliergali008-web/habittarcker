import { useState } from "react";
import { daysUntil, prettyDate, today } from "../lib/dates";
import { addExam, removeExam, uid, useAppData } from "../store";

export default function Exams() {
  const data = useAppData();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [adding, setAdding] = useState(false);

  const upcoming = [...data.exams]
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = [...data.exams]
    .filter((e) => daysUntil(e.date) < 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  const submit = () => {
    if (!name.trim() || !date) return;
    addExam({ id: uid(), name: name.trim(), date });
    setName("");
    setDate("");
    setAdding(false);
  };

  return (
    <div className="screen">
      <div className="eyebrow">Exams</div>
      <h1 className="screen-title">What you're aiming at.</h1>
      <p className="screen-sub">
        The daily plan adapts to whichever of these is closest.
      </p>

      {upcoming.length > 0 && (
        <>
          <div className="section-label">Upcoming</div>
          {upcoming.map((exam) => {
            const days = daysUntil(exam.date);
            return (
              <div className="exam-card" key={exam.id}>
                <div className={`exam-badge ${days <= 14 ? "soon" : ""}`}>
                  <strong>{days === 0 ? "now" : days}</strong>
                  {days > 0 && <small>days</small>}
                </div>
                <div>
                  <div className="exam-name">{exam.name}</div>
                  <div className="exam-date">{prettyDate(exam.date)}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {upcoming.length === 0 && !adding && (
        <div className="empty-state">
          <div className="empty-title">No exam on the horizon.</div>
          Add the next thing you're preparing for and the daily plan will
          start counting down to it.
        </div>
      )}

      {adding ? (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-title">New exam</div>
          <div className="field">
            <label>Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="IELTS, AS Maths Paper 1…"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-quiet" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!name.trim() || !date}
              onClick={submit}
            >
              Add exam
            </button>
          </div>
        </section>
      ) : (
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 20 }}
          onClick={() => setAdding(true)}
        >
          Add an exam
        </button>
      )}

      {past.length > 0 && (
        <>
          <div className="section-label">Done</div>
          <section className="card">
            {past.map((exam) => (
              <div className="past-row" key={exam.id}>
                <div>
                  <div className="exam-name">{exam.name}</div>
                  <div className="exam-date">{prettyDate(exam.date)}</div>
                </div>
                <button
                  className="btn-pill btn-pill-quiet"
                  onClick={() => removeExam(exam.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
