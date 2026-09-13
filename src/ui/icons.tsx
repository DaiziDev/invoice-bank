import type { ReactNode } from 'react';

const Svg = ({ d, s = 20 }: { d: ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);

export const Ic = {
  Back: (p?: { s?: number }) => <Svg s={p?.s} d={<path d="M15 18l-6-6 6-6" />} />,
  Chev: (p?: { s?: number }) => <Svg s={p?.s ?? 16} d={<path d="M9 18l6-6-6-6" />} />,
  Send: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>} />,
  Down: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>} />,
  Up: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>} />,
  Wallet: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4h-4z" /></>} />,
  Phone: (p?: { s?: number }) => <Svg s={p?.s} d={<><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>} />,
  Bank: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M3 21h18" /><path d="M5 21V10" /><path d="M19 21V10" /><path d="M9 21v-6h6v6" /><path d="M2 10l10-7 10 7" /></>} />,
  Swap: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M7 16V4" /><path d="M3 8l4-4 4 4" /><path d="M17 8v12" /><path d="M21 16l-4 4-4-4" /></>} />,
  Receipt: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M5 3v18l2.5-2 2.5 2 2-2 2 2 2.5-2L19 21V3l-2.5 2L14 3l-2 2-2-2-2.5 2L5 3z" /><path d="M9 9h6" /><path d="M9 13h6" /></>} />,
  Scan: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M3 7V5a2 2 0 012-2h2" /><path d="M17 3h2a2 2 0 012 2v2" /><path d="M21 17v2a2 2 0 01-2 2h-2" /><path d="M7 21H5a2 2 0 01-2-2v-2" /><path d="M7 12h10" /></>} />,
  Check: (p?: { s?: number }) => <Svg s={p?.s ?? 34} d={<path d="M20 6L9 17l-5-5" />} />,
  Clock: (p?: { s?: number }) => <Svg s={p?.s ?? 34} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  X: (p?: { s?: number }) => <Svg s={p?.s ?? 34} d={<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>} />,
  Home: (p?: { s?: number }) => <Svg s={p?.s ?? 21} d={<path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z" />} />,
  List: (p?: { s?: number }) => <Svg s={p?.s ?? 21} d={<><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>} />,
  Users: (p?: { s?: number }) => <Svg s={p?.s ?? 21} d={<><path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /></>} />,
  Cog: (p?: { s?: number }) => <Svg s={p?.s ?? 21} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>} />,
  Bell: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>} />,
  Share: (p?: { s?: number }) => <Svg s={p?.s ?? 17} d={<><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></>} />,
  Finger: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M12 11v4" /><path d="M8 11a4 4 0 018 0v5a3 3 0 01-3 3" /><path d="M5 12a7 7 0 0114 0v3" /></>} />,
  WifiOff: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 017 0" /><path d="M5 12.9a10 10 0 015.2-2.7" /><path d="M12 20h.01" /></>} />,
  Search: (p?: { s?: number }) => <Svg s={p?.s ?? 17} d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  Plus: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />,
  Info: (p?: { s?: number }) => <Svg s={p?.s ?? 17} d={<><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>} />,
  Star: (p?: { s?: number }) => <Svg s={p?.s ?? 17} d={<path d="M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1L12 2z" />} />,
  Lock: (p?: { s?: number }) => <Svg s={p?.s ?? 13} d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>} />,
  Del: (p?: { s?: number }) => <Svg s={p?.s ?? 19} d={<><path d="M20 5H9l-6 7 6 7h11a1 1 0 001-1V6a1 1 0 00-1-1z" /><path d="M17 9l-5 6" /><path d="M12 9l5 6" /></>} />,
  Globe: (p?: { s?: number }) => <Svg s={p?.s ?? 19} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 010 18 15 15 0 010-18z" /></>} />,
  Reset: (p?: { s?: number }) => <Svg s={p?.s ?? 19} d={<><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8" /><path d="M3 3v5h5" /></>} />,
  Power: (p?: { s?: number }) => <Svg s={p?.s} d={<><path d="M12 3v9" /><path d="M18.4 6.6a9 9 0 11-12.8 0" /></>} />,
};
