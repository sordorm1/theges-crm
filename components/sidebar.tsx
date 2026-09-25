"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BASE_PATH } from "@/lib/base-path";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Settings2,
  Wallet,
  UserCog,
  LogOut,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitch } from "@/components/language-switch";
import { useAuth } from "@/lib/auth/auth-context";

const NAV_ITEMS = [
  { href: "/", key: "nav.dashboard", section: "dashboard", icon: LayoutDashboard },
  { href: "/partners", key: "nav.partners", section: "partners", icon: Building2 },
  { href: "/students", key: "nav.students", section: "students", icon: Users },
  { href: "/exams", key: "nav.exams", section: "exams", icon: GraduationCap },
  { href: "/finance", key: "nav.finance", section: "finance", icon: Wallet },
  { href: "/settings", key: "nav.settings", section: "settings", icon: Settings2 },
  { href: "/users", key: "nav.users", section: "users", icon: UserCog },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, can, signOut } = useAuth();
  const items = NAV_ITEMS.filter((item) => can(item.section));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="rounded-lg bg-white p-1 shadow-sm">
          <Image src={`${BASE_PATH}/logo.png`} alt="the GES" width={24} height={24} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide">{t("nav.appName")}</span>
          <span className="text-[10px] text-sidebar-foreground/50">
            {t("nav.tagline")}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2.2} />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 px-3 py-4">
        {user && (
          <div className="flex flex-col gap-1 rounded-lg bg-sidebar-accent/40 px-2 py-2">
            <div className="truncate text-xs font-semibold" data-testid="sidebar-user">
              {user.displayName || user.login}
            </div>
            <div className="text-[10px] text-sidebar-foreground/50">
              {user.role === "admin" ? t("nav.roleAdmin") : t("nav.roleStaff")}
            </div>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                signOut();
              }}
              className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
            >
              <LogOut className="size-3.5" />
              {t("nav.logout")}
            </button>
          </div>
        )}
        <LanguageSwitch />
        <div className="text-[10px] text-sidebar-foreground/40">
          © {new Date().getFullYear()} the GES
        </div>
      </div>
    </div>
  );
}
