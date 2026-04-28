"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MapPinned,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getPendingSuppliers } from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import {
  buildSupplierSearchText,
  formatDate,
  formatDateOnly,
  getApplicationCode,
  getCreatedAt,
  getDisplayName,
  getEmail,
  getLocation,
  getPhone,
  getSource,
  getStatus,
  getStatusLabel,
  getStatusPillClass,
  getSupplierId,
  getUsername,
  sortSuppliersByNewest,
} from "@/features/auth/supplier-review-utils";
import AdminShell from "./admin-shell";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function getStatusCategory(status: string): Exclude<StatusFilter, "all"> | "other" {
  const normalized = normalizeStatus(status);

  if (["approved", "active", "accepted", "verified"].includes(normalized)) {
    return "approved";
  }

  if (["rejected", "declined", "denied"].includes(normalized)) {
    return "rejected";
  }

  if (
    [
      "pending",
      "waiting",
      "in_review",
      "review",
      "pending_review",
      "submitted",
      "application_pending",
    ].includes(normalized)
  ) {
    return "pending";
  }

  return "other";
}

function getStatusIcon(status: string) {
  const category = getStatusCategory(status);

  if (category === "approved") return <CheckCircle2 className="h-4 w-4" />;
  if (category === "rejected") return <XCircle className="h-4 w-4" />;

  return <Clock3 className="h-4 w-4" />;
}

function countByStatus(items: PendingSupplierRecord[], filter: StatusFilter) {
  if (filter === "all") return items.length;
  return items.filter((item) => getStatusCategory(getStatus(item)) === filter).length;
}

function safeSupplierId(item: PendingSupplierRecord) {
  return getSupplierId(item) || String(item.id ?? "");
}

export default function AdminSuppliersPendingView() {
  const [items, setItems] = useState<PendingSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getPendingSuppliers();
      const sorted = sortSuppliersByNewest(response);

      setItems(sorted);
      setLastLoadedAt(new Date().toISOString());
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      all: countByStatus(items, "all"),
      pending: countByStatus(items, "pending"),
      approved: countByStatus(items, "approved"),
      rejected: countByStatus(items, "rejected"),
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        getStatusCategory(getStatus(item)) === statusFilter;

      const matchesQuery =
        !keyword || buildSupplierSearchText(item).includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  const statusFilters: Array<{
    key: StatusFilter;
    label: string;
    count: number;
  }> = [
    {
      key: "all",
      label: "All Applications",
      count: stats.all,
    },
    {
      key: "pending",
      label: "Pending",
      count: stats.pending,
    },
    {
      key: "approved",
      label: "Approved",
      count: stats.approved,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: stats.rejected,
    },
  ];

  return (
    <AdminShell
      title="Supplier Review Flow"
      description="Direktori aplikasi supplier dibuat sebagai alur review. Pilih salah satu supplier untuk masuk ke halaman overview detail, lalu lakukan approve atau reject dari halaman detail tersebut."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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
            className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Supplier Approval Workflow
              </p>
              <h2 className="mt-3 font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                Review supplier sebagai alur, bukan action langsung di list
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                Halaman ini hanya untuk melihat direktori aplikasi supplier.
                Approve dan reject dipindahkan ke halaman overview detail agar
                keputusan admin lebih rapi dan tidak salah klik.
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container p-4 text-sm text-on-surface-variant">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                Last refresh
              </p>
              <p className="mt-1 font-semibold text-on-surface">
                {lastLoadedAt ? formatDate(lastLoadedAt) : "-"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Step 01
              </p>
              <h3 className="mt-2 font-headline text-lg font-extrabold text-on-surface">
                Application Directory
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Admin melihat semua aplikasi supplier beserta status review-nya.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                <Eye className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Step 02
              </p>
              <h3 className="mt-2 font-headline text-lg font-extrabold text-on-surface">
                Overview Detail
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Klik supplier untuk membuka detail data diri, lahan, dan payout.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-tertiary-container text-on-tertiary-container">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Step 03
              </p>
              <h3 className="mt-2 font-headline text-lg font-extrabold text-on-surface">
                Final Decision
              </h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Approve atau reject hanya dilakukan setelah admin membuka detail.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Total
                </p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.all}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Pending
                </p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.pending}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tertiary-container text-on-tertiary-container">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Approved
                </p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.approved}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Rejected
                </p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.rejected}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                <ClipboardList className="h-4 w-4 text-primary" />
                Pending Application Directory
              </p>
              <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                Supplier Applications
              </h2>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[32rem] lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama, username, no HP, lokasi, status..."
                  className="w-full rounded-2xl border-none bg-surface-container-low py-3 pl-10 pr-4 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
                <Filter className="h-4 w-4" />
                <span>{filteredItems.length} shown</span>
              </div>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-sm"
                      : "shrink-0 rounded-full bg-surface-container px-4 py-2 text-xs font-extrabold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
                  }
                >
                  {filter.label}
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5">
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Gagal memuat data supplier.</p>
                  <p className="mt-1 text-sm">{errorMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl bg-surface-container-low p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat aplikasi supplier...
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="font-headline text-xl font-extrabold text-on-surface">
                Tidak ada aplikasi yang cocok
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
                Data dari API kosong, atau filter pencarian/status tidak menemukan
                supplier yang sesuai.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/10">
              <div className="hidden bg-surface-container-low px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant lg:grid lg:grid-cols-[1.25fr_1fr_1fr_0.85fr_0.9fr_3rem] lg:gap-4">
                <div>Supplier</div>
                <div>Contact</div>
                <div>Location</div>
                <div>Status</div>
                <div>Submitted</div>
                <div />
              </div>

              <div className="divide-y divide-outline-variant/10">
                {filteredItems.map((item) => {
                  const supplierId = safeSupplierId(item);
                  const status = getStatus(item);
                  const detailHref = `/admin/suppliers/pending/${encodeURIComponent(
                    supplierId
                  )}`;

                  return (
                    <Link
                      key={`${supplierId}-${getApplicationCode(item)}`}
                      href={detailHref}
                      className="group block bg-surface-container-lowest px-4 py-4 transition hover:bg-surface-container-low sm:px-5"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr_0.85fr_0.9fr_3rem] lg:items-center">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
                              {getApplicationCode(item)}
                            </span>
                            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant">
                              {getSource(item)}
                            </span>
                          </div>

                          <p className="truncate font-headline text-lg font-extrabold text-on-surface">
                            {getDisplayName(item)}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-on-surface-variant">
                            @{getUsername(item)}
                          </p>
                        </div>

                        <div className="min-w-0 space-y-2 text-sm text-on-surface-variant">
                          <p className="flex min-w-0 items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span className="truncate">{getPhone(item)}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{getEmail(item)}</span>
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="flex min-w-0 items-start gap-2 text-sm font-semibold text-on-surface-variant">
                            <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{getLocation(item)}</span>
                          </p>
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${getStatusPillClass(
                              status
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2 font-semibold text-on-surface">
                            <CalendarDays className="h-4 w-4 text-on-surface-variant" />
                            {formatDateOnly(getCreatedAt(item))}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {formatDate(getCreatedAt(item))}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition group-hover:bg-primary group-hover:text-white">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}