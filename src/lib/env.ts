export const env = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "GoGrowcery",
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",

  AUTH_LOGIN_PATH:
    process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || "/api/auth/login",
  AUTH_REGISTER_BUYER_PATH:
    process.env.NEXT_PUBLIC_AUTH_REGISTER_BUYER_PATH ||
    "/api/auth/register/buyer",
  AUTH_REGISTER_SUPPLIER_PATH:
    process.env.NEXT_PUBLIC_AUTH_REGISTER_SUPPLIER_PATH ||
    "/api/auth/register/supplier",
  AUTH_ME_PATH: process.env.NEXT_PUBLIC_AUTH_ME_PATH || "/api/auth/me",
  AUTH_LOGOUT_PATH:
    process.env.NEXT_PUBLIC_AUTH_LOGOUT_PATH || "/api/auth/logout",

  ADMIN_SUPPLIERS_PENDING_PATH:
    process.env.NEXT_PUBLIC_ADMIN_SUPPLIERS_PENDING_PATH ||
    "/api/admin/suppliers/pending",
  ADMIN_SUPPLIER_APPROVE_PATH_TEMPLATE:
    process.env.NEXT_PUBLIC_ADMIN_SUPPLIER_APPROVE_PATH_TEMPLATE ||
    "/api/admin/suppliers/{id}/approve",
  ADMIN_SUPPLIER_REJECT_PATH_TEMPLATE:
    process.env.NEXT_PUBLIC_ADMIN_SUPPLIER_REJECT_PATH_TEMPLATE ||
    "/api/admin/suppliers/{id}/reject",
};