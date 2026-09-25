"use client";

import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "@/lib/i18n/context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, retry } = useAuth();
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (status === "unreachable") {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <WifiOff className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{t("login.unreachableTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("login.unreachableText")}</p>
        <Button onClick={retry}>{t("login.retry")}</Button>
      </div>
    );
  }

  if (status === "anonymous") return <LoginScreen />;

  return <>{children}</>;
}
