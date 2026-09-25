import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import {
  LOGIN_PATTERN,
  USER_COLUMNS,
  cleanPermissions,
  hashPassword,
  newSalt,
  newSessionToken,
  publicUser,
  sessionExpiry,
  sha256Hex,
  timingSafeEqual,
  type UserRow,
} from "../_shared/auth.ts";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 64;

interface RequestBody {
  action?: string;
  token?: string;
  login?: string;
  password?: string;
  displayName?: string;
  permissions?: unknown;
  userId?: string;
  isActive?: boolean;
}

type Db = ReturnType<typeof supabaseAdmin>;

function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return jsonResponse({ error, ...extra }, status);
}

async function userFromToken(db: Db, token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const { data: session } = await db
    .from("app_sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const { data: user } = await db.from("app_users").select(USER_COLUMNS).eq("id", session.user_id).maybeSingle();
  if (!user || !user.is_active) return null;
  return user as UserRow;
}

function validPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "login") {
      const login = (body.login ?? "").trim().toLowerCase();
      const password = body.password ?? "";
      if (!login || !password) return fail("INVALID_CREDENTIALS", 401);

      const { data: row } = await db
        .from("app_users")
        .select(`${USER_COLUMNS}, password_hash, password_salt, failed_attempts, locked_until`)
        .eq("login", login)
        .maybeSingle();

      if (!row) {
        // same amount of work as a real check, so a missing login is not detectable by timing
        await hashPassword(password, "0".repeat(32));
        return fail("INVALID_CREDENTIALS", 401);
      }

      if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000);
        return fail("ACCOUNT_LOCKED", 429, { retryAfterSeconds });
      }

      const candidate = await hashPassword(password, row.password_salt);
      if (!timingSafeEqual(candidate, row.password_hash)) {
        const failed = row.failed_attempts + 1;
        if (failed >= MAX_FAILED_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
          await db.from("app_users").update({ failed_attempts: 0, locked_until: lockedUntil }).eq("id", row.id);
          return fail("ACCOUNT_LOCKED", 429, { retryAfterSeconds: LOCK_MINUTES * 60 });
        }
        await db.from("app_users").update({ failed_attempts: failed }).eq("id", row.id);
        return fail("INVALID_CREDENTIALS", 401);
      }

      if (!row.is_active) return fail("ACCOUNT_DISABLED", 403);

      await db.from("app_sessions").delete().eq("user_id", row.id).lt("expires_at", new Date().toISOString());
      await db
        .from("app_users")
        .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
        .eq("id", row.id);

      const token = newSessionToken();
      const { error } = await db
        .from("app_sessions")
        .insert({ token_hash: await sha256Hex(token), user_id: row.id, expires_at: sessionExpiry() });
      if (error) throw error;

      return jsonResponse({ token, user: publicUser(row as UserRow) });
    }

    if (body.action === "me") {
      const user = await userFromToken(db, body.token);
      if (!user) return fail("INVALID_SESSION", 401);
      return jsonResponse({ user: publicUser(user) });
    }

    if (body.action === "logout") {
      if (body.token) await db.from("app_sessions").delete().eq("token_hash", await sha256Hex(body.token));
      return jsonResponse({ ok: true });
    }

    // everything below is for the director only
    const admin = await userFromToken(db, body.token);
    if (!admin) return fail("INVALID_SESSION", 401);
    if (admin.role !== "admin") return fail("FORBIDDEN", 403);

    if (body.action === "list-users") {
      const { data, error } = await db.from("app_users").select(USER_COLUMNS).order("created_at", { ascending: true });
      if (error) throw error;
      return jsonResponse({ users: (data as UserRow[]).map(publicUser) });
    }

    if (body.action === "create-user") {
      const login = (body.login ?? "").trim().toLowerCase();
      const displayName = (body.displayName ?? "").trim().slice(0, 60);
      if (!LOGIN_PATTERN.test(login)) return fail("INVALID_LOGIN", 400);
      if (!validPassword(body.password)) return fail("INVALID_PASSWORD", 400);

      const salt = newSalt();
      const { data, error } = await db
        .from("app_users")
        .insert({
          login,
          display_name: displayName,
          password_hash: await hashPassword(body.password, salt),
          password_salt: salt,
          role: "staff",
          permissions: cleanPermissions(body.permissions),
        })
        .select(USER_COLUMNS)
        .single();
      if (error) {
        if (error.code === "23505") return fail("LOGIN_TAKEN", 409);
        throw error;
      }
      return jsonResponse({ user: publicUser(data as UserRow) });
    }

    if (body.action === "update-user") {
      if (!body.userId) return fail("USER_ID_REQUIRED", 400);
      const { data: target } = await db.from("app_users").select(USER_COLUMNS).eq("id", body.userId).maybeSingle();
      if (!target) return fail("USER_NOT_FOUND", 404);

      const patch: Record<string, unknown> = {};
      if (body.displayName !== undefined) patch.display_name = body.displayName.trim().slice(0, 60);
      if (body.permissions !== undefined && target.role !== "admin") patch.permissions = cleanPermissions(body.permissions);
      if (body.isActive !== undefined) {
        if (target.role === "admin" && body.isActive === false) return fail("CANNOT_DISABLE_ADMIN", 400);
        patch.is_active = body.isActive;
      }
      if (body.password !== undefined) {
        if (!validPassword(body.password)) return fail("INVALID_PASSWORD", 400);
        const salt = newSalt();
        patch.password_salt = salt;
        patch.password_hash = await hashPassword(body.password, salt);
        patch.failed_attempts = 0;
        patch.locked_until = null;
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await db.from("app_users").update(patch).eq("id", target.id);
        if (error) throw error;
      }

      // a disabled account or a changed password ends the target's sessions (the admin keeps their own)
      if (body.isActive === false || body.password !== undefined) {
        const keepHash = target.id === admin.id && body.token ? await sha256Hex(body.token) : null;
        let q = db.from("app_sessions").delete().eq("user_id", target.id);
        if (keepHash) q = q.neq("token_hash", keepHash);
        await q;
      }

      const { data: updated } = await db.from("app_users").select(USER_COLUMNS).eq("id", target.id).single();
      return jsonResponse({ user: publicUser(updated as UserRow) });
    }

    if (body.action === "delete-user") {
      if (!body.userId) return fail("USER_ID_REQUIRED", 400);
      if (body.userId === admin.id) return fail("CANNOT_DELETE_SELF", 400);
      const { data: target } = await db.from("app_users").select(USER_COLUMNS).eq("id", body.userId).maybeSingle();
      if (!target) return fail("USER_NOT_FOUND", 404);
      if (target.role === "admin") {
        const { count } = await db.from("app_users").select("id", { count: "exact", head: true }).eq("role", "admin");
        if ((count ?? 0) <= 1) return fail("CANNOT_DELETE_LAST_ADMIN", 400);
      }
      const { error } = await db.from("app_users").delete().eq("id", target.id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return fail("UNKNOWN_ACTION", 400);
  } catch (e) {
    console.error("auth function error", e);
    return fail("SERVER_ERROR", 500);
  }
});
