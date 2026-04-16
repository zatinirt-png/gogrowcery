"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, RefreshCw, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveSupplier,
  getPendingSuppliers,
  rejectSupplier,
} from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import AdminShell from "./admin-shell";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDisplayName(item: PendingSupplierRecord) {
  return item.nama_lengkap || item.name || item.username || "-";
}

type WorkingState = {
  id: string | number | null;
  action: "approve" | "reject" | null;
};

export default function AdminSuppliersPendingView() {
  const [items, setItems] = useState<PendingSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [working, setWorking] = useState<WorkingState>({
    id: null,
    action: null,
  });

  const load = async () => {
    setIsLoading(true);

    try {
      const normalized = await getPendingSuppliers();
      setItems(normalized);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(() => items.length, [items]);

  const handleAction = async (
    id: number | string,
    action: "approve" | "reject"
  ) => {
    setWorking({ id, action });

    try {
      if (action === "approve") {
        await approveSupplier(id);
        toast.success("Supplier berhasil di-approve.");
      } else {
        await rejectSupplier(id, "Rejected by admin");
        toast.success("Supplier berhasil di-reject.");
      }

      await load();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setWorking({ id: null, action: null });
    }
  };

  return (
    <AdminShell
      title="Pending Supplier Review"
      description="Halaman ini menjadi area live untuk admin review. Data diambil dari endpoint pending supplier, lalu action approve dan reject dikirim langsung dari kartu review."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <Link
            href="/admin/suppliers/add"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-outline-variant/15 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Queue Size
            </p>
            <p className="mt-3 font-headline text-4xl font-extrabold text-on-surface">
              {isLoading ? "-" : pendingCount}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Jumlah supplier yang berhasil dibaca dari response.
            </p>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Endpoint Status
            </p>
            <p className="mt-3 font-headline text-4xl font-extrabold text-primary">
              Live
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              GET pending dan PATCH approve/reject aktif.
            </p>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Review Status
            </p>
            <p className="mt-3 font-headline text-4xl font-extrabold text-on-surface">
              Ready
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Admin dapat approve atau reject dari halaman ini.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Pending Queue
              </p>
              <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                Supplier applications
              </h2>
            </div>

            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">
              {isLoading ? "Loading..." : `${pendingCount} pending`}
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat supplier pending...
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-5 text-sm text-on-surface-variant">
              Tidak ada data pending dari endpoint.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {items.map((item) => {
                const id = item.id;
                const isApproveLoading =
                  working.id === id && working.action === "approve";
                const isRejectLoading =
                  working.id === id && working.action === "reject";
                const isCurrentRowLoading = working.id === id;

                return (
                  <article
                    key={String(id)}
                    className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-5"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      <div className="grid flex-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Supplier
                          </p>
                          <p className="mt-1 text-lg font-bold text-on-surface">
                            {getDisplayName(item)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Username
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {item.username || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Email
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface break-all">
                            {item.email || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Phone
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {item.no_hp || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Status
                          </p>
                          <p className="mt-1">
                            <span className="inline-flex rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold capitalize text-on-tertiary-fixed-variant">
                              {item.status || "pending"}
                            </span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            Created At
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => handleAction(id, "approve")}
                          disabled={isCurrentRowLoading}
                          className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-70"
                        >
                          {isApproveLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(id, "reject")}
                          disabled={isCurrentRowLoading}
                          className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-2xl border border-red-700 bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-70"
                          style={{ opacity: 1 }}
                        >
                          {isRejectLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}