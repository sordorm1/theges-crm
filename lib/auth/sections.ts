export const SECTIONS = ["dashboard", "partners", "students", "exams", "finance", "settings"] as const;
export type Section = (typeof SECTIONS)[number];
export type Guarded = Section | "users";

export type Role = "admin" | "staff";

export interface AuthUser {
  id: string;
  login: string;
  displayName: string;
  role: Role;
  permissions: Section[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const SECTION_PATHS: Record<Section, string> = {
  dashboard: "/",
  partners: "/partners",
  students: "/students",
  exams: "/exams",
  finance: "/finance",
  settings: "/settings",
};

/** Which guarded section a URL belongs to; null for unknown URLs (left to Next's own 404). */
export function sectionForPath(pathname: string): Guarded | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "dashboard";
  if (path === "/users" || path.startsWith("/users/")) return "users";
  for (const section of SECTIONS) {
    if (section === "dashboard") continue;
    const base = SECTION_PATHS[section];
    if (path === base || path.startsWith(`${base}/`)) return section;
  }
  return null;
}

export function canAccess(user: AuthUser | null, section: Guarded): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (section === "users") return false;
  return user.permissions.includes(section);
}

export function firstAllowedSection(user: AuthUser | null): Section | null {
  if (!user) return null;
  return SECTIONS.find((s) => canAccess(user, s)) ?? null;
}
