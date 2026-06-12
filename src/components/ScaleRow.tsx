interface Props {
  value?: number;
  labels?: [string, string];
  onChange: (value: number) => void;
}

/** A 1–5 tap row. The whole morning check-in is two of these. */
export default function ScaleRow({ value, labels, onChange }: Props) {
  return (
    <div className="scale-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`scale-dot ${value === n ? "active" : ""}`}
          onClick={() => onChange(n)}
        >
          {n}
          {labels && n === 1 && <small>{labels[0]}</small>}
          {labels && n === 5 && <small>{labels[1]}</small>}
        </button>
      ))}
    </div>
  );
}
