"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { SECTION_PATHS, firstAllowedSection, sectionForPath } from "@/lib/auth/sections";
import { useTranslation } from "@/lib/i18n/context";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, can } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const section = sectionForPath(pathname);
  const allowed = section === null || can(section);
  const fallback = firstAllowedSection(user);

  // Landing on "/" without dashboard access: go straight to the first section that is open.
  const redirectTarget = !allowed && section === "dashboard" && fallback ? SECTION_PATHS[fallback] : null;
  useEffect(() => {
    if (redirectTarget) router.replace(redirectTarget);
  }, [redirectTarget, router]);

  if (allowed) return <>{children}</>;
  if (redirectTarget) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ShieldOff className="size-6" />
      </span>
      <h1 className="text-xl font-bold">{t("noAccess.title")}</h1>
      <p className="text-sm text-muted-foreground">{fallback ? t("noAccess.text") : t("noAccess.none")}</p>
      {fallback && (
        <Button render={<Link href={SECTION_PATHS[fallback]} />}>
          {t("noAccess.goTo", t(`nav.${fallback}`))}
        </Button>
      )}
    </div>
  );
}
