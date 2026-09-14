"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BASE_PATH } from "@/lib/base-path";
import { LayoutDashboard, Building2, Users, GraduationCap, Settings2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/partners", label: "Партнёры", icon: Building2 },
  { href: "/students", label: "Ученики", icon: Users },
  { href: "/exams", label: "Экзамены", icon: GraduationCap },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="rounded-xl bg-white p-1.5 shadow-sm">
          <Image src={`${BASE_PATH}/logo.png`} alt="the GES" width={30} height={30} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide">the GES</span>
          <span className="text-[11px] text-sidebar-foreground/50">
            Test Prep CRM
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-sidebar-foreground/40">
        © {new Date().getFullYear()} the GES
      </div>
    </div>
  );
}
