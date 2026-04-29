"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import { getAdminBountyDetail } from "@/features/bounty/api";
import type { AdminBountyRecord } from "@/features/bounty/types";
import BountyDetailPanel from "@/features/bounty/components/bounty-detail-panel";

type AdminBountyDetailViewProps = {
  bountyId: string;
};

export default function AdminBountyDetailView({ bountyId }: AdminBountyDetailViewProps) {
  const [bounty, setBounty] = useState<AdminBountyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await getAdminBountyDetail(bountyId);
      setBounty(response);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bounty admin.";
      setBounty(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (mode === "initial") setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDetail("initial");
  }, [bountyId]);

  return (
    <AdminShell
      title="Bounty Detail"
      description="Halaman detail bounty dari endpoint admin. Gunakan halaman ini untuk review isi permintaan sebelum tindak lanjut."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => loadDetail("refresh")}
            disabled={isLoading || isRefreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 sm:w-auto"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <Link
            href="/admin/bounties/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat detail bounty...</span>
          </div>
        </div>
      ) : errorMessage || !bounty ? (
        <section className="rounded-3xl border border-error/15 bg-error-container p-5 shadow-sm">
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
          backHref="/admin/bounties"
          backLabel="Kembali ke Bounty Directory"
          viewerName="Admin"
          viewerRole="admin"
          sourceLabel="Admin Bounty API"
        />
      )}
    </AdminShell>
  );
}