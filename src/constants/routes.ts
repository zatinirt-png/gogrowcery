export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  REGISTER_BUYER: "/register/buyer",
  REGISTER_SUPPLIER: "/register/supplier",
} as const;

export const PROTECTED_ROUTES = {
  ADMIN: "/admin",
  BUYER: "/buyer",
  SUPPLIER: "/supplier",
} as const;