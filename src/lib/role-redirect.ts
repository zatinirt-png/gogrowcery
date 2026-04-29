import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes";

export function normalizeAppRole(role?: string | null) {
  const normalized = (role || "").trim().toLowerCase();

  if (["supplier", "farmer", "petani"].includes(normalized)) {
    return "supplier";
  }

  if (normalized === "admin") return "admin";
  if (normalized === "buyer") return "buyer";

  return normalized;
}

export function getRoleRedirectPath(role?: string | null) {
  switch (normalizeAppRole(role)) {
    case "admin":
      return PROTECTED_ROUTES.ADMIN;
    case "buyer":
      return PROTECTED_ROUTES.BUYER;
    case "supplier":
      return PROTECTED_ROUTES.SUPPLIER;
    default:
      return PUBLIC_ROUTES.LOGIN;
  }
}