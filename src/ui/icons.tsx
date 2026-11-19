const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconPlay = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...P}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M5.6 18.4l2.5-2.5M15.9 8.1l2.5-2.5" />
  </svg>
);
export const IconStats = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...P}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
export const IconSessions = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...P}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
export const IconSettings = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" {...P}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
export const IconUndo = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...P}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);
export const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...P}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconMic = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...P}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" />
  </svg>
);
export const IconSpeaker = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...P}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {on ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9.5l4.5 5M21.5 9.5 17 14.5" />}
  </svg>
);
