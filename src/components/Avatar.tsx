/** Flat illustrated avatar for the greeting header. */
export default function Avatar({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#f6d9b4" />
      {/* shoulders */}
      <path d="M8 48c1.5-9 8-13 16-13s14.5 4 16 13z" fill="#e9712d" />
      {/* head */}
      <circle cx="24" cy="21" r="11.5" fill="#f0b287" />
      {/* hair */}
      <path
        d="M12.5 21c-.6-7.5 4.6-12.5 11.5-12.5S36.1 13.5 35.5 21c-2.6-1.6-4.3-4.6-4.7-6.4-2.4 2.3-9.4 3.4-13.6 2.2-.4 1.5-2 3.2-4.7 4.2z"
        fill="#3b2c20"
      />
      {/* face */}
      <path d="M19.2 22.6q1.3-1.8 2.6 0M26.2 22.6q1.3-1.8 2.6 0" stroke="#2b241c" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M21.2 26.4q2.8 2.6 5.6 0" stroke="#2b241c" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="17.4" cy="25.2" r="1.5" fill="#ec8e63" opacity="0.55" />
      <circle cx="30.6" cy="25.2" r="1.5" fill="#ec8e63" opacity="0.55" />
    </svg>
  );
}
