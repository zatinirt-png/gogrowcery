"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import UniversalAppShell from "@/components/common/universal-app-shell";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";

type ProtectedUserPanelProps = {
  title: string;
  description: string;
};

export default function ProtectedUserPanel({
  title,
  description,
}: ProtectedUserPanelProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await getMe();

        if (isMounted) {
          setUser(response.user);
        }
      } catch (error) {
        clearAuthSession();
        toast.error(getAuthErrorMessage(error));
        router.replace("/login");
        router.refresh();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
      router.replace("/login");
      router.refresh();
    }
  };

  if (isLoading) return null;

  return (
    <UniversalAppShell
      title={title}
      description={description}
      role={user?.role}
      user={user}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      actions={
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-on-surface px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sedang logout...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Logout
            </>
          )}
        </button>
      }
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-outline-variant/15">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Nama
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {user?.name ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Email
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {user?.email ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Role
              </p>
              <p className="mt-2 text-lg font-bold capitalize text-on-surface">
                {user?.role ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Status
              </p>
              <p className="mt-2 text-lg font-bold text-primary">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </UniversalAppShell>
  );
}
