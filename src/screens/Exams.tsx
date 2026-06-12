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
          <div className="card">
            {upcoming.map((exam) => {
              const days = daysUntil(exam.date);
              return (
                <div className="exam-row" key={exam.id}>
                  <div>
                    <div className="exam-name">{exam.name}</div>
                    <div className="exam-date">{prettyDate(exam.date)}</div>
                  </div>
                  <div className="exam-count">
                    <div className={`exam-days ${days <= 14 ? "soon" : ""}`}>
                      {days === 0 ? "today" : days}
                    </div>
                    {days > 0 && <div className="exam-days-label">days</div>}
                  </div>
                </div>
              );
            })}
          </div>
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
        <div className="card" style={{ marginTop: 20 }}>
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
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-ghost btn-block" onClick={() => setAdding(true)}>
            Add an exam
          </button>
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="section-label">Done</div>
          <div className="card">
            {past.map((exam) => (
              <div className="exam-row" key={exam.id}>
                <div>
                  <div className="exam-name">{exam.name}</div>
                  <div className="exam-date">{prettyDate(exam.date)}</div>
                </div>
                <button
                  className="btn btn-quiet"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  onClick={() => removeExam(exam.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
