"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BASE_PATH } from "@/lib/base-path";
import { LayoutDashboard, Building2, Users, GraduationCap, Settings2, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/partners", label: "Партнёры", icon: Building2 },
  { href: "/students", label: "Ученики", icon: Users },
  { href: "/exams", label: "Экзамены", icon: GraduationCap },
  { href: "/finance", label: "Финансы", icon: Wallet },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="rounded-lg bg-white p-1 shadow-sm">
          <Image src={`${BASE_PATH}/logo.png`} alt="the GES" width={24} height={24} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide">the GES</span>
          <span className="text-[10px] text-sidebar-foreground/50">
            Test Prep CRM
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2">
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
                "flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2.2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 text-[10px] text-sidebar-foreground/40">
        © {new Date().getFullYear()} the GES
      </div>
    </div>
  );
}
