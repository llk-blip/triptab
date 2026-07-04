// Presentational helpers for the "Sunny Passport" design (Claude Design 2a).
// Pure display logic — no money math, no state.

/** Avatar palette from the design; stable per member via index. */
const AVATAR_COLORS = ["#FF6B4A", "#3B82C4", "#9B5DE5", "#2FAE7C", "#FFC542"];

export function avatarColor(index: number): string {
  return AVATAR_COLORS[((index % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Best-effort category emoji from an expense description. Fallback: receipt. */
const EMOJI_RULES: [RegExp, string][] = [
  [/taxi|grab|uber|cab|ride/i, "🚕"],
  [/hotel|hostel|airbnb|room|stay|accommodation/i, "🏨"],
  [/ramen|noodle|pho|dinner|lunch|breakfast|food|meal|restaurant|eat|cafe|coffee/i, "🍜"],
  [/flight|plane|airport|airline/i, "✈️"],
  [/train|metro|subway|bus|transport/i, "🚆"],
  [/ticket|museum|temple|tour|entry|show|festival/i, "🏮"],
  [/shop|souvenir|market|mall|gift/i, "🛍️"],
  [/drink|beer|bar|wine|sake/i, "🍺"],
  [/snack|dessert|ice cream|cake/i, "🍡"],
];

export function categoryEmoji(description: string): string {
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(description)) return emoji;
  }
  return "🧾";
}

/** Soft tile background matching the avatar palette, keyed by emoji. */
export function tileBg(emoji: string): string {
  const tints = ["#FFEBD1", "#E3F2EC", "#EFE9FB", "#E7F0FA", "#FFF3D6"];
  let h = 0;
  for (const ch of emoji) h = (h * 31 + ch.codePointAt(0)!) % tints.length;
  return tints[h];
}
