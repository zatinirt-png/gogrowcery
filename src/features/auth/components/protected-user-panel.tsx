"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
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

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Memuat profil pengguna...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-outline-variant/15">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Name
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {user?.name ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Email
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {user?.email ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Role
              </p>
              <p className="mt-2 text-lg font-bold capitalize text-on-surface">
                {user?.role ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Status
              </p>
              <p className="mt-2 text-lg font-bold text-primary">
                Authenticated
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-on-surface px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Logout
            </>
          )}
        </button>
      </div>
    </div>
  );
}