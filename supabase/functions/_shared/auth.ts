const PBKDF2_ITERATIONS = 100_000;
const SESSION_DAYS = 14;

export const SECTIONS = ["dashboard", "partners", "students", "exams", "finance", "settings"] as const;
export type Section = (typeof SECTIONS)[number];

const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(byteLength: number) {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function newSalt() {
  return randomHex(16);
}

export async function hashPassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sha256Hex(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export function newSessionToken() {
  return randomHex(32);
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function cleanPermissions(input: unknown): Section[] {
  if (!Array.isArray(input)) return [];
  return SECTIONS.filter((s) => input.includes(s));
}

export const LOGIN_PATTERN = /^[a-z0-9._-]{3,20}$/;

export interface UserRow {
  id: string;
  login: string;
  display_name: string;
  role: "admin" | "staff";
  permissions: string[];
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export const USER_COLUMNS = "id, login, display_name, role, permissions, is_active, created_at, last_login_at";

export function publicUser(u: UserRow) {
  return {
    id: u.id,
    login: u.login,
    displayName: u.display_name,
    role: u.role,
    // admins always see every section, regardless of what is stored
    permissions: u.role === "admin" ? [...SECTIONS] : cleanPermissions(u.permissions),
    isActive: u.is_active,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  };
}
