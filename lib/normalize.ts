/** Normalizes text for loose matching: lowercase, strips spaces/dashes. */
export function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[\s-]/g, "");
}

/** Keeps only digits, and compares the last N digits — tolerant of +998/leading zero differences. */
export function normalizePhoneTail(value: string, tailLength = 9): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-tailLength);
}
