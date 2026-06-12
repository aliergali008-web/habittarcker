export type Tab = "today" | "focus" | "log" | "insights" | "exams";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const icons = {
  today: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9" />
    </svg>
  ),
  focus: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="13.3" r="7.6" />
      <path d="M12 9.4v4l2.7 1.8M9.7 2.8h4.6" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M3.5 17.5l4.4-5.4 3.7 2.9 5-7 3.9 4.2" />
      <path d="M3.5 21h17" />
    </svg>
  ),
  exams: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M5 21V4.2C5 3.5 5.5 3 6.2 3h11.6c.7 0 1.2.5 1.2 1.2V21" />
      <path d="M9 7.5h6M9 11.5h6M9 15.5h3.5" />
    </svg>
  ),
};

const pencil = (
  <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.1}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const labels: Record<Exclude<Tab, "log">, string> = {
  today: "Today",
  focus: "Focus",
  insights: "Insights",
  exams: "Exams",
};

interface Props {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

export default function TabBar({ tab, onChange }: Props) {
  const item = (id: Exclude<Tab, "log">) => (
    <button
      className={`tab ${tab === id ? "active" : ""}`}
      aria-label={labels[id]}
      onClick={() => onChange(id)}
    >
      <span className="tab-bubble">{icons[id]}</span>
      <span className="tab-label">{labels[id]}</span>
    </button>
  );

  return (
    <nav className="tabbar">
      <div className="tabbar-inner glass">
        {item("today")}
        {item("focus")}
        <button
          className="tab-log-btn"
          aria-label="Evening log"
          onClick={() => onChange("log")}
        >
          {pencil}
        </button>
        {item("insights")}
        {item("exams")}
      </div>
    </nav>
  );
}
