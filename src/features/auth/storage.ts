import Cookies from "js-cookie";
import { normalizeAppRole } from "@/lib/role-redirect";

export const AUTH_TOKEN_KEY = "gg_token";
export const AUTH_ROLE_KEY = "gg_role";

type PersistSessionOptions = {
  remember?: boolean;
};

export function setAccessToken(token: string, options?: PersistSessionOptions) {
  Cookies.set(AUTH_TOKEN_KEY, token, {
    expires: options?.remember ? 7 : undefined,
    sameSite: "lax",
  });
}

export function getAccessToken() {
  return Cookies.get(AUTH_TOKEN_KEY) ?? null;
}

export function removeAccessToken() {
  Cookies.remove(AUTH_TOKEN_KEY);
}

export function normalizeRole(role: string) {
  return normalizeAppRole(role);
}

export function setUserRole(role: string, options?: PersistSessionOptions) {
  Cookies.set(AUTH_ROLE_KEY, normalizeAppRole(role), {
    expires: options?.remember ? 7 : undefined,
    sameSite: "lax",
  });
}

export function getUserRole() {
  const role = Cookies.get(AUTH_ROLE_KEY);
  return role ? normalizeAppRole(role) : null;
}

export function removeUserRole() {
  Cookies.remove(AUTH_ROLE_KEY);
}

export function persistAuthSession(
  token: string,
  role: string,
  options?: PersistSessionOptions
) {
  setAccessToken(token, options);
  setUserRole(role, options);
}

export function clearAuthSession() {
  removeAccessToken();
  removeUserRole();
}