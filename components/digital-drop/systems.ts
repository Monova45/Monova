export function firewallRadius(seconds: number) { return Math.max(8, 48 - Math.max(0, seconds) * .23); }
export function matchResult(hp: number, kills: number, radius: number): 'over'|'win'|null {
  if (hp <= 0) return 'over';
  return kills >= 16 && radius <= 8 ? 'win' : null;
}
export function absorbDamage(hp: number, shield: number, damage: number) {
  const absorbed = Math.min(shield, Math.max(0, damage));
  return { hp: Math.max(0, hp - Math.max(0, damage) + absorbed), shield: shield - absorbed };
}
