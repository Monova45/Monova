// Inline SVG icon set for the interface. All icons use currentColor and a 24×24 (or 64×32 for weapons) viewBox.
type P = { className?: string };

/** Weapon silhouettes, indexed like `weapons` in state.ts. */
export const WeaponIcon = ({ index, className }: P & { index: number }) => <svg viewBox="0 0 64 32" className={className} fill="currentColor" aria-hidden>
  {index === 0 && <path d="M6 10h34l4-3h8v6h-6l-2 3H30l-3 9h-7l2-9H6z" />}
  {index === 1 && <path d="M2 11h12V8h30l3 2h15v4H48l-2 2H33l-3 10h-7l2-10h-6l-4 7H8l3-7H2z" />}
  {index === 2 && <path d="M4 8h40l6-4h10v14H50l-6-4h-6l-3 12h-9l2-12H4zM10 12h4v-1h-4z" />}
  {index === 3 && <path d="M3 12h10l3-5h26l4 3h14v6H46l-3 3H31l-2 8h-8l1-8h-6l-3 4H3z" />}
  {index === 4 && <path d="M6 12h30l4-4h20v3l-6 2 6 2v3H40l-4-4h-8l-3 12h-7l2-12H6zM46 11h2v4h-2z" />}
</svg>;

const icon = (d: string, filled = true) => function Icon({ className }: P) {
  return <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
};

export const ShieldIcon = icon('M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z');
export const HealthIcon = icon('M9 3h6v6h6v6h-6v6H9v-6H3V9h6z');
export const StormIcon = icon('M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 11a1 1 0 1 0 1 1', false);
export const PlayersIcon = icon('M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6M1 21c0-4 3-7 7-7s7 3 7 7zm15-7c4 0 7 3 7 7h-5');
export const SkullIcon = icon('M12 2C7 2 3 5.6 3 10.5c0 2.8 1.4 4.8 3 6V20a2 2 0 0 0 2 2h1v-3h2v3h2v-3h2v3h1a2 2 0 0 0 2-2v-3.5c1.6-1.2 3-3.2 3-6C21 5.6 17 2 12 2zM8.5 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z');
export const BugIcon = icon('M9 4l1.5 2h3L15 4l1.5 1-1.4 2A5 5 0 0 1 17 11h3v2h-3v1h3v2h-3.3A5 5 0 0 1 7.3 16H4v-2h3v-1H4v-2h3a5 5 0 0 1 1.9-4L7.5 5z');
export const CrownIcon = icon('M3 7l5 4 4-7 4 7 5-4-2 12H5z');
export const CheckIcon = icon('M4 12l5 5L20 6', false);
export const CopyIcon = icon('M9 9h11v11H9zM5 15H4V4h11v1', false);
export const LinkIcon = icon('M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1', false);
export const PlusIcon = icon('M12 5v14M5 12h14', false);
export const CoinIcon = icon('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 4v1.2c1.6.3 2.8 1.3 3 2.8h-2.3c-.2-.6-.9-1-1.8-1-1.1 0-1.7.4-1.7 1 0 .7.8.9 2.2 1.2 2.1.4 3.8 1.1 3.8 3.2 0 1.6-1.3 2.8-3.2 3.1V18h-2v-1.5c-1.9-.3-3.2-1.4-3.4-3.1h2.3c.2.8 1 1.2 2.1 1.2s1.8-.4 1.8-1.1c0-.6-.6-.9-2.1-1.2-2-.4-3.8-1-3.8-3.2 0-1.5 1.2-2.6 3.1-2.9V6z');

/** Ability glyphs, indexed like `abilities` in state.ts. */
export const AbilityIcon = ({ index, className }: P & { index: number }) => [
  icon('M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zM12 7v10M7 12h10', false),
  icon('M13 2 4 14h7l-1 8 9-12h-7z'),
  icon('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
  icon('M4 20 20 4M14 4h6v6M4 14v6h6', false),
][index]({ className });
