"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import UniversalAppShell from "@/components/common/universal-app-shell";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function AdminShell({
  title,
  description,
  children,
  actions,
}: AdminShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await getMe();
        if (!isMounted) return;
        setUser(response.user);
      } catch (error) {
        clearAuthSession();
        toast.error(getAuthErrorMessage(error));
        router.replace("/login");
        router.refresh();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Logout berhasil");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      clearAuthSession();
      router.replace("/");
      router.refresh();
    }
  };

  if (isLoading) return null;

  return (
    <UniversalAppShell
      title={title}
      description={description}
      actions={actions}
      role={user?.role ?? "admin"}
      user={user}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </UniversalAppShell>
  );
}