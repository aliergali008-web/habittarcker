import Face from "./Face";

interface Props {
  value?: number;
  labels?: [string, string];
  onChange: (value: number) => void;
}

/** A 1–5 tap row of drawn faces. The whole morning check-in is two of these. */
export default function ScaleRow({ value, labels, onChange }: Props) {
  return (
    <div className="scale-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`scale-dot ${value === n ? "active" : ""}`}
          aria-label={`${n} of 5`}
          onClick={() => onChange(n)}
        >
          <Face v={n} tone={value === n ? "#f7f1e7" : "#4d443a"} />
          {labels && n === 1 && <small>{labels[0]}</small>}
          {labels && n === 5 && <small>{labels[1]}</small>}
        </button>
      ))}
    </div>
  );
}
