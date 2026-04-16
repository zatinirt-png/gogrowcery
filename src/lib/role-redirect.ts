import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "@/constants/routes";

export function getRoleRedirectPath(role?: string | null) {
  switch ((role || "").toLowerCase()) {
    case "admin":
      return PROTECTED_ROUTES.ADMIN;
    case "buyer":
      return PROTECTED_ROUTES.BUYER;
    case "supplier":
    case "farmer":
      return PROTECTED_ROUTES.SUPPLIER;
    default:
      return PUBLIC_ROUTES.LOGIN;
  }
}