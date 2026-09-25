import { EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
import type { AuthUser, Section } from "@/lib/auth/sections";

export class AuthApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public retryAfterSeconds?: number,
  ) {
    super(code);
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${EDGE_FUNCTIONS_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("NETWORK_ERROR", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(data.error ?? "SERVER_ERROR", res.status, data.retryAfterSeconds);
  return data as T;
}

export interface UserInput {
  displayName: string;
  login: string;
  password: string;
  permissions: Section[];
}

export interface UserPatch {
  displayName?: string;
  permissions?: Section[];
  isActive?: boolean;
  password?: string;
}

export const authApi = {
  login: (login: string, password: string) =>
    call<{ token: string; user: AuthUser }>({ action: "login", login, password }),
  me: (token: string) => call<{ user: AuthUser }>({ action: "me", token }),
  logout: (token: string) => call<{ ok: true }>({ action: "logout", token }),
  listUsers: (token: string) => call<{ users: AuthUser[] }>({ action: "list-users", token }),
  createUser: (token: string, input: UserInput) =>
    call<{ user: AuthUser }>({ action: "create-user", token, ...input }),
  updateUser: (token: string, userId: string, patch: UserPatch) =>
    call<{ user: AuthUser }>({ action: "update-user", token, userId, ...patch }),
  deleteUser: (token: string, userId: string) =>
    call<{ ok: true }>({ action: "delete-user", token, userId }),
};
