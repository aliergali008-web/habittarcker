/** Small flat illustrations and accents, drawn to match the card style. */

export function Trophy({ size = 86 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <g transform="rotate(8 48 48)">
        {/* handles */}
        <path
          d="M26 30H16c-1 12 5 19 14 20M70 30h10c1 12-5 19-14 20"
          fill="none"
          stroke="#d8893c"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* cup */}
        <path
          d="M26 22h44v16c0 14-9 24-22 24S26 52 26 38z"
          fill="#f3a64a"
        />
        <path d="M26 22h44v7H26z" fill="#e9712d" opacity="0.35" />
        {/* star */}
        <path
          d="M48 33l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9z"
          fill="#fff3df"
        />
        {/* stem + base */}
        <path d="M43 62h10l2 9H41z" fill="#d8893c" />
        <rect x="34" y="71" width="28" height="9" rx="4.5" fill="#3b2c20" />
      </g>
      {/* sparkles */}
      <path d="M14 14l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2z" fill="#fff" opacity="0.9" />
      <circle cx="84" cy="20" r="3.4" fill="#fff" opacity="0.8" />
      <circle cx="78" cy="78" r="2.6" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export function Squiggle({ width = 110, color = "#e9712d" }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="12" viewBox="0 0 110 12" aria-hidden>
      <path
        d="M2 8c9-7 17-7 26 0s17 7 26 0 17-7 26 0 17 7 26 0"
        fill="none"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Bolt({ size = 14, color = "#e9712d" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M13.5 2L5 13.5h5.5L10 22l8.5-11.5H13z" fill={color} />
    </svg>
  );
}
