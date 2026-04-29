"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import { getSupplierBountyDetail } from "@/features/bounty/api";
import type { SupplierBountyRecord } from "@/features/bounty/types";
import BountyDetailPanel from "@/features/bounty/components/bounty-detail-panel";
import SupplierShell from "./supplier-shell";

type SupplierBountyDetailViewProps = {
  bountyId: string;
};

export default function SupplierBountyDetailView({
  bountyId,
}: SupplierBountyDetailViewProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bounty, setBounty] = useState<SupplierBountyRecord | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingBounty, setIsLoadingBounty] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoadingBounty(true);
    else setIsRefreshing(true);

    try {
      const response = await getSupplierBountyDetail(bountyId);
      setBounty(response);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bounty supplier.";
      setBounty(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (mode === "initial") setIsLoadingBounty(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function bootUser() {
      try {
        const meResponse = await getMe();
        if (!isMounted) return;
        setUser(meResponse.user);
      } catch (error) {
        clearAuthSession();
        toast.error(getAuthErrorMessage(error));
        router.replace("/login");
        router.refresh();
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    }

    bootUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    loadDetail("initial");
  }, [bountyId]);

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

  return (
    <SupplierShell
      title="Bounty Detail"
      description="Detail bounty yang tersedia untuk supplier. Cek item, deadline, dan informasi permintaan."
      actions={
        <button
          type="button"
          onClick={() => loadDetail("refresh")}
          disabled={isLoadingBounty || isRefreshing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Detail
        </button>
      }
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounty ? (
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat detail bounty supplier...</span>
          </div>
        </div>
      ) : errorMessage || !bounty ? (
        <section className="rounded-3xl bg-error-container p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
            <div className="min-w-0">
              <p className="font-bold text-on-error-container">Detail bounty gagal dibaca</p>
              <p className="mt-1 break-words text-sm text-on-error-container">
                {errorMessage || "Data bounty tidak ditemukan."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <BountyDetailPanel
          record={bounty}
          backHref="/supplier/bounties"
          backLabel="Kembali ke Bounty Directory"
          viewerName={user?.name}
          viewerRole={user?.role}
          sourceLabel="Supplier Bounty API"
        />
      )}
    </SupplierShell>
  );
}