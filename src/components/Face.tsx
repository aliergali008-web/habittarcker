interface Props {
  /** 1–5, rough → great */
  v: number;
  size?: number;
  /** stroke color; defaults to ink */
  tone?: string;
}

/**
 * Hand-drawn flat faces (no platform emoji — they should look identical
 * on every device and match the illustration style).
 */
export default function Face({ v, size = 26, tone = "#2b241c" }: Props) {
  const s = {
    fill: "none",
    stroke: tone,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const dot = (cx: number) => (
    <circle cx={cx} cy={11.4} r={1.45} fill={tone} stroke="none" />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {v === 1 && (
        <g {...s}>
          <path d="M6.2 7.6l3.4 1.7M17.8 7.6l-3.4 1.7" />
          {dot(8.7)}
          {dot(15.3)}
          <path d="M8.3 17.2q3.7-3 7.4 0" />
        </g>
      )}
      {v === 2 && (
        <g {...s}>
          {dot(8.7)}
          {dot(15.3)}
          <path d="M8.8 16.6q3.2-1.6 6.4 0" />
        </g>
      )}
      {v === 3 && (
        <g {...s}>
          {dot(8.7)}
          {dot(15.3)}
          <path d="M8.8 16h6.4" />
        </g>
      )}
      {v === 4 && (
        <g {...s}>
          {dot(8.7)}
          {dot(15.3)}
          <path d="M8.2 14.6q3.8 3.4 7.6 0" />
        </g>
      )}
      {v === 5 && (
        <g {...s}>
          <path d="M6.8 11.2q1.7-2.4 3.4 0M13.8 11.2q1.7-2.4 3.4 0" />
          <path d="M7.8 14.4q4.2 4.6 8.4 0" />
          <circle cx="5.6" cy="14.6" r="1.1" fill={tone} stroke="none" opacity="0.25" />
          <circle cx="18.4" cy="14.6" r="1.1" fill={tone} stroke="none" opacity="0.25" />
        </g>
      )}
    </svg>
  );
}
