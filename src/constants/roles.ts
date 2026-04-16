export const ROLES = {
  ADMIN: "admin",
  BUYER: "buyer",
  SUPPLIER: "supplier",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];