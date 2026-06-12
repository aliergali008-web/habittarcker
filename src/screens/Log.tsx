import { useState } from "react";
import ScaleRow from "../components/ScaleRow";
import { today } from "../lib/dates";
import { parseBrainDump } from "../lib/parser";
import { saveEveningLog, useAppData } from "../store";
import type { EveningLog } from "../types";
import type { Tab } from "../components/TabBar";

interface Props {
  go: (tab: Tab) => void;
}

type Stage = "write" | "confirm";

export default function Log({ go }: Props) {
  const data = useAppData();
  const date = today();
  const existing = data.logs.find((l) => l.date === date);

  const [stage, setStage] = useState<Stage>("write");
  const [raw, setRaw] = useState(existing?.raw ?? "");
  const [parsed, setParsed] = useState<EveningLog | null>(null);

  const parse = () => {
    setParsed(parseBrainDump(raw, date));
    setStage("confirm");
  };

  const save = () => {
    if (!parsed) return;
    saveEveningLog(parsed);
    go("today");
  };

  if (stage === "confirm" && parsed) {
    return (
      <div className="screen">
        <div className="eyebrow">Evening log</div>
        <h1 className="screen-title">Did I get this right?</h1>
        <p className="screen-sub">Tap anything that's wrong — you're the judge.</p>

        <div className="section-label">What I picked up</div>
        <div className="card">
          <div className="chip-row">
            {parsed.sleepHours !== undefined && (
              <button
                className="chip"
                onClick={() => setParsed({ ...parsed, sleepHours: undefined })}
              >
                slept {parsed.sleepHours}h <span className="chip-x">×</span>
              </button>
            )}
            {Object.entries(parsed.studied).map(([subject, mins]) => (
              <button
                key={subject}
                className="chip"
                onClick={() => {
                  const studied = { ...parsed.studied };
                  delete studied[subject];
                  setParsed({ ...parsed, studied });
                }}
              >
                {subject}
                {mins > 0 && ` · ${mins >= 60 ? `${(mins / 60).toFixed(mins % 60 ? 1 : 0)}h` : `${mins}m`}`}
                <span className="chip-x">×</span>
              </button>
            ))}
            {parsed.sleepHours === undefined &&
              Object.keys(parsed.studied).length === 0 && (
                <span className="chip chip-muted">
                  Nothing structured found — saving as a note is fine
                </span>
              )}
          </div>

          <div className="divider" />
          <div className="card-title" style={{ fontSize: 16 }}>
            Mood today
          </div>
          <ScaleRow
            value={parsed.mood}
            emojis={["😖", "😕", "😐", "🙂", "😄"]}
            labels={["rough", "great"]}
            onChange={(mood) => setParsed({ ...parsed, mood })}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn btn-quiet" onClick={() => setStage("write")}>
            Edit text
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
            Save day
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="eyebrow">Evening log</div>
      <h1 className="screen-title">How was today?</h1>
      <p className="screen-sub">
        One messy sentence. Sleep, food, mood, what you studied — any order,
        no structure.
      </p>

      <div style={{ marginTop: 20 }}>
        <textarea
          className="dump-box"
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="slept 6h, skipped lunch, did 2h of math past papers, felt tired but ok…"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          className="btn btn-primary btn-block"
          disabled={!raw.trim()}
          onClick={parse}
        >
          Done
        </button>
      </div>
      {existing && (
        <p className="screen-sub" style={{ marginTop: 12, textAlign: "center" }}>
          You already logged today — saving again replaces it.
        </p>
      )}
    </div>
  );
}
