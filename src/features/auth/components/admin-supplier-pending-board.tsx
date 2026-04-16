"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveSupplier,
  getPendingSuppliers,
  rejectSupplier,
} from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";

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

export default function AdminSupplierPendingBoard() {
  const [items, setItems] = useState<PendingSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [working, setWorking] = useState<WorkingState>({
    id: null,
    action: null,
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingSuppliers();
      setItems(data);
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
    id: string | number,
    action: "approve" | "reject"
  ) => {
    setWorking({ id, action });

    try {
      if (action === "approve") {
        await approveSupplier(id);
        toast.success("Supplier berhasil di-approve.");
      } else {
        await rejectSupplier(id);
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
    <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">
            Pending Supplier Review
          </h2>
          <p className="mt-2 text-on-surface-variant">
            Endpoint ini mengikuti collection production untuk daftar pending,
            approve, dan reject supplier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">
            {pendingCount} pending
          </div>
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat supplier pending...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          Tidak ada data pending yang bisa dibaca dari endpoint.
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {items.map((item) => {
            const id = item.id;
            const isApproveLoading =
              working.id === id && working.action === "approve";
            const isRejectLoading =
              working.id === id && working.action === "reject";
            const isAnyLoading = working.id === id;

            return (
              <article
                key={String(id)}
                className="rounded-[24px] border border-outline-variant/15 bg-surface-container-low p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid flex-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Supplier
                      </p>
                      <p className="mt-1 text-xl font-bold text-on-surface">
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
                      <p className="mt-1 break-all text-sm font-semibold text-on-surface">
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
                      <div className="mt-1">
                        <span className="inline-flex rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold capitalize text-on-tertiary-fixed-variant">
                          {item.status || "pending"}
                        </span>
                      </div>
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

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => handleAction(id, "approve")}
                      disabled={isAnyLoading}
                      className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
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
                      disabled={isAnyLoading}
                      className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl border border-red-700 bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
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
  );
}