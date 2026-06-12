interface Props {
  value?: number;
  /** five faces, low → high */
  emojis: string[];
  labels?: [string, string];
  onChange: (value: number) => void;
}

/** A 1–5 emoji tap row. The whole morning check-in is two of these. */
export default function ScaleRow({ value, emojis, labels, onChange }: Props) {
  return (
    <div className="scale-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={`scale-dot ${value === n ? "active" : ""}`}
          aria-label={`${n} of 5`}
          onClick={() => onChange(n)}
        >
          <span className="scale-face">{emojis[n - 1]}</span>
          {labels && n === 1 && <small>{labels[0]}</small>}
          {labels && n === 5 && <small>{labels[1]}</small>}
        </button>
      ))}
    </div>
  );
}
