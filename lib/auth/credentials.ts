const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** Lowercase latin words made from a name typed in Cyrillic or Latin (o' / g' collapse to o / g). */
function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/([og])['‘’`ʻʼ]/g, "$1")
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch) => TRANSLIT[ch] ?? ch)
        .join("")
        .replace(/[^a-z0-9]/g, ""),
    )
    .filter(Boolean);
}

const MAX_BASE = 14;

/** A short, readable login: "Aziza Karimova" -> aziza, then aziza.k, then aziza2, aziza3… */
export function generateLogin(name: string, taken: Set<string>): string {
  const words = nameWords(name);
  let base = (words[0] ?? "user").slice(0, MAX_BASE);
  if (base.length < 3) base = base.padEnd(3, "1");

  const candidates = [base];
  if (words[1]) candidates.push(`${base}.${words[1][0]}`);
  for (let n = 2; n < 100; n++) candidates.push(`${base}${n}`);
  return candidates.find((c) => !taken.has(c)) ?? `${base}${Date.now() % 100000}`.slice(0, 20);
}

function randomDigits(count: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(count));
  return [...bytes].map((b) => String(b % 10)).join("");
}

function isTooEasy(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const digits = [...pin].map(Number);
  const step = digits[1] - digits[0];
  return Math.abs(step) === 1 && digits.every((d, i) => i === 0 || d - digits[i - 1] === step);
}

/** 4 random digits, never something like 0000 / 1234 / 4321. */
export function generatePassword(): string {
  let pin = randomDigits(4);
  while (isTooEasy(pin)) pin = randomDigits(4);
  return pin;
}

export function generateCredentials(name: string, takenLogins: Set<string>) {
  return { login: generateLogin(name, takenLogins), password: generatePassword() };
}

export const LOGIN_PATTERN = /^[a-z0-9._-]{3,20}$/;
