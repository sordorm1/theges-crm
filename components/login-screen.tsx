"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitch } from "@/components/language-switch";
import { AuthApiError } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "@/lib/i18n/context";
import { BASE_PATH } from "@/lib/base-path";

export function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError(t("login.errors.required"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(login.trim(), password);
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.code === "INVALID_CREDENTIALS") setError(t("login.errors.invalid"));
        else if (err.code === "ACCOUNT_LOCKED")
          setError(t("login.errors.locked", Math.max(1, Math.ceil((err.retryAfterSeconds ?? 600) / 60))));
        else if (err.code === "ACCOUNT_DISABLED") setError(t("login.errors.disabled"));
        else if (err.code === "NETWORK_ERROR") setError(t("login.errors.network"));
        else setError(t("login.errors.server"));
      } else {
        setError(t("login.errors.server"));
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="absolute top-4 right-4 rounded-xl bg-sidebar p-2 text-sidebar-foreground shadow-sm">
        <LanguageSwitch />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-border">
            <Image src={`${BASE_PATH}/logo.png`} alt="the GES" width={44} height={44} priority />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("login.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-input">{t("login.login")}</Label>
            <Input
              id="login-input"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder={t("login.loginPlaceholder")}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password-input">{t("login.password")}</Label>
            <div className="relative">
              <Input
                id="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="pr-10 font-mono"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
