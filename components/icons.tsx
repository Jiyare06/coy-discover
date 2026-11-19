const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
export const CompassIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </svg>
);
export const HeartIcon = ({ size = 28 }: { size?: number }) => (
  <svg {...base} width={size} height={size} fill="currentColor" stroke="none">
    <path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.2 3.3 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.7 0 5.9 3.7 4.5 7.2C19.5 16.4 12 21 12 21z" />
  </svg>
);
export const XIcon = ({ size = 28 }: { size?: number }) => (
  <svg {...base} width={size} height={size} strokeWidth={3}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const PinIcon = () => (
  <svg {...base} width={14} height={14}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
