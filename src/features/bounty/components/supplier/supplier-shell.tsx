"use client";

import type { ReactNode } from "react";
import UniversalAppShell from "@/components/common/universal-app-shell";
import type { AuthUser } from "@/features/auth/types";

type SupplierShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  user?: AuthUser | null;
};

export default function SupplierShell({
  title,
  description,
  children,
  actions,
  onLogout,
  isLoggingOut = false,
  user,
}: SupplierShellProps) {
  return (
    <UniversalAppShell
      title={title}
      description={description}
      actions={actions}
      role={user?.role ?? "supplier"}
      user={user}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </UniversalAppShell>
  );
}
