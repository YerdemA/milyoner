/** 0 -> "A", 1 -> "B"... */
export const optionLetter = (index: number) => String.fromCharCode(65 + index);

/** Keyboard key -> option index: A–F or 1–6. Returns null for other keys. */
export function optionIndexFromKey(key: string): number | null {
  const upper = key.toUpperCase();
  if (upper.length === 1 && upper >= "A" && upper <= "F") return upper.charCodeAt(0) - 65;
  if (key.length === 1 && key >= "1" && key <= "6") return Number(key) - 1;
  return null;
}
