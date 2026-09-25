"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Sparkles, Copy, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, AuthApiError } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { SECTIONS, type AuthUser, type Section } from "@/lib/auth/sections";
import { LOGIN_PATTERN, generateCredentials, generatePassword } from "@/lib/auth/credentials";
import { useTranslation } from "@/lib/i18n/context";
import { formatTashkentDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Editor = { mode: "create" } | { mode: "edit"; user: AuthUser };
interface Credentials {
  login: string;
  password: string;
}

function initials(user: AuthUser) {
  const source = user.displayName.trim() || user.login;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function copyText(text: string, message: string) {
  navigator.clipboard?.writeText(text);
  toast.success(message);
}

function CredentialsDialog({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  const { t } = useTranslation();
  const rows: [string, string][] = [
    [t("users.form.login"), credentials.login],
    [t("users.form.password"), credentials.password],
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            {t("users.credentials.title")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("users.credentials.text")}</p>
        <div className="flex flex-col gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
                <div data-testid={`cred-${label}`} className="font-mono text-base font-semibold break-all select-all">
                  {value}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={t("users.form.copy")}
                onClick={() => copyText(value, t("users.credentials.copiedToast"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              copyText(
                t("users.credentials.copyText", credentials.login, credentials.password),
                t("users.credentials.copiedToast"),
              )
            }
          >
            <Copy className="size-4" />
            {t("users.credentials.copyAll")}
          </Button>
          <Button onClick={onClose}>{t("users.credentials.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserFormDialog({
  editor,
  users,
  onClose,
  onSaved,
}: {
  editor: Editor;
  users: AuthUser[];
  onClose: () => void;
  onSaved: (user: AuthUser, credentials: Credentials | null) => void;
}) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const target = editor.mode === "edit" ? editor.user : null;
  const isAdminTarget = target?.role === "admin";

  const [name, setName] = useState(target?.displayName ?? "");
  const [login, setLogin] = useState(target?.login ?? "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Section[]>(target?.permissions ?? []);
  const [active, setActive] = useState(target?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenLogins = useMemo(() => new Set(users.map((u) => u.login)), [users]);

  function handleGenerate() {
    if (!target) {
      if (!name.trim()) {
        setError(t("users.errors.nameRequired"));
        return;
      }
      const next = generateCredentials(name, takenLogins);
      setLogin(next.login);
      setPassword(next.password);
    } else {
      setPassword(generatePassword());
    }
    setError(null);
  }

  function toggle(section: Section) {
    setPermissions((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  }

  async function handleSave() {
    if (!token) return;
    const cleanLogin = login.trim().toLowerCase();
    if (!target) {
      if (!name.trim()) return setError(t("users.errors.nameRequired"));
      if (!LOGIN_PATTERN.test(cleanLogin)) return setError(t("users.errors.invalidLogin"));
      if (password.length < 4) return setError(t("users.errors.invalidPassword"));
    } else if (password && password.length < 4) {
      return setError(t("users.errors.invalidPassword"));
    }

    setSaving(true);
    setError(null);
    try {
      if (!target) {
        const { user } = await authApi.createUser(token, {
          displayName: name.trim(),
          login: cleanLogin,
          password,
          permissions,
        });
        onSaved(user, { login: user.login, password });
      } else {
        const { user } = await authApi.updateUser(token, target.id, {
          displayName: name.trim(),
          ...(isAdminTarget ? {} : { permissions, isActive: active }),
          ...(password ? { password } : {}),
        });
        onSaved(user, password ? { login: user.login, password } : null);
      }
    } catch (e) {
      const code = e instanceof AuthApiError ? e.code : "";
      if (code === "LOGIN_TAKEN") setError(t("users.errors.loginTaken"));
      else if (code === "INVALID_LOGIN") setError(t("users.errors.invalidLogin"));
      else if (code === "INVALID_PASSWORD") setError(t("users.errors.invalidPassword"));
      else setError(t("users.errors.saveFailed"));
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{target ? t("users.form.editTitle") : t("users.form.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">{t("users.form.name")}</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("users.form.namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground">{t("users.form.generateHint")}</p>
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleGenerate}>
                <Sparkles className="size-3.5" />
                {target ? t("users.form.generatePassword") : t("users.form.generate")}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-login">{t("users.form.login")}</Label>
                <div className="flex gap-1">
                  <Input
                    id="user-login"
                    value={login}
                    onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    readOnly={!!target}
                    autoCapitalize="none"
                    spellCheck={false}
                    className={cn("font-mono", target && "bg-muted")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={t("users.form.copy")}
                    disabled={!login}
                    onClick={() => copyText(login, t("users.credentials.copiedToast"))}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-password">{t("users.form.password")}</Label>
                <div className="flex gap-1">
                  <Input
                    id="user-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={target ? t("users.form.passwordKeep") : ""}
                    autoComplete="off"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={t("users.form.copy")}
                    disabled={!password}
                    onClick={() => copyText(password, t("users.credentials.copiedToast"))}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{t("users.form.sections")}</Label>
              {!isAdminTarget && (
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setPermissions([...SECTIONS])}
                  >
                    {t("users.form.selectAll")}
                  </button>
                  <button
                    type="button"
                    className="font-medium text-muted-foreground hover:underline"
                    onClick={() => setPermissions([])}
                  >
                    {t("users.form.clearAll")}
                  </button>
                </div>
              )}
            </div>
            {isAdminTarget ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {t("users.form.adminNote")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map((section) => (
                  <label
                    key={section}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      data-section={section}
                      checked={permissions.includes(section)}
                      onChange={() => toggle(section)}
                      className="size-4 accent-primary"
                    />
                    {t(`nav.${section}`)}
                  </label>
                ))}
              </div>
            )}
          </div>

          {target && !isAdminTarget && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                data-testid="active-toggle"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-primary"
              />
              {t("users.form.active")}
            </label>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("users.form.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("users.form.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({
  user,
  isSelf,
  onEdit,
  onDelete,
}: {
  user: AuthUser;
  isSelf: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const { t, locale } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div
      data-testid={`user-row-${user.login}`}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm",
        !user.isActive && "opacity-70",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {initials(user)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{user.displayName || user.login}</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              isAdmin
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-blue-200 bg-blue-50 text-blue-700",
            )}
          >
            {isAdmin ? t("nav.roleAdmin") : t("nav.roleStaff")}
          </span>
          {!user.isActive && (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              {t("users.disabled")}
            </span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-xs text-muted-foreground">{user.login}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {isAdmin ? (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{t("users.allSections")}</span>
          ) : user.permissions.length === 0 ? (
            <span className="text-xs text-muted-foreground">{t("users.noSections")}</span>
          ) : (
            user.permissions.map((s) => (
              <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {t(`nav.${s}`)}
              </span>
            ))
          )}
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {t("users.lastLogin")}: {user.lastLoginAt ? formatTashkentDateTime(user.lastLoginAt, locale) : t("users.never")}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label={t("users.edit")} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        {!isAdmin && !isSelf && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("users.delete")}
            className="text-muted-foreground hover:text-destructive"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onDelete();
              setDeleting(false);
            }}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { token, user: me } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .listUsers(token)
      .then(({ users: list }) => {
        if (cancelled) return;
        setUsers(list);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleDelete(user: AuthUser) {
    if (!token) return;
    if (!confirm(t("users.toasts.deleteConfirm", user.displayName || user.login))) return;
    try {
      await authApi.deleteUser(token, user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(t("users.toasts.deleted"));
    } catch {
      toast.error(t("users.errors.deleteFailed"));
    }
  }

  function handleSaved(saved: AuthUser, shown: Credentials | null) {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === saved.id);
      return exists ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved];
    });
    const wasCreate = editor?.mode === "create";
    setEditor(null);
    if (shown) setCredentials(shown);
    toast.success(wasCreate ? t("users.toasts.created", saved.displayName || saved.login) : t("users.toasts.updated"));
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("users.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={() => setEditor({ mode: "create" })}>
          <Plus className="size-4" />
          {t("users.create")}
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{t("users.errors.loadFailed")}</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("users.empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === me?.id}
              onEdit={() => setEditor({ mode: "edit", user: u })}
              onDelete={() => handleDelete(u)}
            />
          ))}
        </div>
      )}

      {editor && (
        <UserFormDialog
          key={editor.mode === "edit" ? editor.user.id : "create"}
          editor={editor}
          users={users}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}
      {credentials && <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}
