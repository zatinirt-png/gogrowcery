"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Eye,
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
import {
  getAdminSuppliers,
  getPendingSuppliers,
} from "@/features/auth/api";
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
  getKtp,
  getLocation,
  getPhone,
  getSource,
  getStatusLabel,
  getSupplierId,
  getUsername,
  pickString,
  sortSuppliersByNewest,
} from "@/features/auth/supplier-review-utils";
import AdminShell from "./admin-shell";

type DirectorySource = "registered" | "pending" | "merged";

type DirectorySupplierRecord = PendingSupplierRecord & {
  __directorySource?: DirectorySource;
  __directoryKey?: string;
  __isPendingApplication?: boolean;
};

type StatusFilter = "all" | "registered" | "pending" | "approved" | "rejected";

type LoadWarning = {
  registered?: string;
  pending?: string;
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function getDirectoryStatus(item: DirectorySupplierRecord) {
  const explicitStatus = pickString(
    item,
    [
      "approval_status",
      "status",
      "application_status",
      "review_status",
      "data.approval_status",
      "data.status",
      "supplier.status",
      "supplier.approval_status",
      "user.status",
    ],
    ""
  );

  if (explicitStatus) return explicitStatus;

  if (item.__isPendingApplication || item.__directorySource === "pending") {
    return "pending";
  }

  return "registered";
}

function getStatusCategory(status: string): Exclude<StatusFilter, "all"> | "other" {
  const normalized = normalizeStatus(status);

  if (["approved", "active", "accepted", "verified", "registered"].includes(normalized)) {
    return normalized === "registered" ? "registered" : "approved";
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

function getDirectoryBucket(item: DirectorySupplierRecord): StatusFilter {
  if (item.__isPendingApplication) return "pending";

  const category = getStatusCategory(getDirectoryStatus(item));

  if (category === "approved") return "approved";
  if (category === "rejected") return "rejected";
  if (category === "pending") return "pending";

  return "registered";
}

function getStatusIcon(status: string) {
  const category = getStatusCategory(status);

  if (category === "approved" || category === "registered") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (category === "rejected") {
    return <XCircle className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

function statusPillClass(status: string) {
  const category = getStatusCategory(status);

  if (category === "approved" || category === "registered") {
    return "bg-primary text-white";
  }

  if (category === "rejected") {
    return "bg-red-600 text-white";
  }

  if (category === "pending") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-surface-container-high text-on-surface-variant";
}

function getSupplierKey(
  item: PendingSupplierRecord,
  index: number,
  source: "registered" | "pending"
) {
  const stableKey =
    getSupplierId(item) ||
    getUsername(item) ||
    getEmail(item) ||
    getPhone(item) ||
    getKtp(item);

  if (stableKey && stableKey !== "-") return stableKey;

  return `${source}-${index}`;
}

function mergeSupplierDirectory(
  registeredSuppliers: PendingSupplierRecord[],
  pendingSuppliers: PendingSupplierRecord[]
): DirectorySupplierRecord[] {
  const map = new Map<string, DirectorySupplierRecord>();

  registeredSuppliers.forEach((item, index) => {
    const key = getSupplierKey(item, index, "registered");

    map.set(key, {
      ...item,
      __directoryKey: key,
      __directorySource: "registered",
      __isPendingApplication: getStatusCategory(getDirectoryStatus(item)) === "pending",
    });
  });

  pendingSuppliers.forEach((item, index) => {
    const key = getSupplierKey(item, index, "pending");
    const existing = map.get(key);

    map.set(key, {
      ...(existing ?? {}),
      ...item,
      __directoryKey: key,
      __directorySource: existing ? "merged" : "pending",
      __isPendingApplication: true,
    });
  });

  return sortSuppliersByNewest(Array.from(map.values())) as DirectorySupplierRecord[];
}

function countByFilter(items: DirectorySupplierRecord[], filter: StatusFilter) {
  if (filter === "all") return items.length;

  return items.filter((item) => {
    const bucket = getDirectoryBucket(item);

    if (filter === "registered") {
      return bucket === "registered" || bucket === "approved";
    }

    return bucket === filter;
  }).length;
}

function getSourceLabel(item: DirectorySupplierRecord) {
  if (item.__directorySource === "merged") return "Registered + Pending";
  if (item.__directorySource === "pending") return "Pending Application";

  const source = getSource(item);
  return source === "Public Registration" ? "Registered Supplier" : source;
}

function getDetailHref(item: DirectorySupplierRecord) {
  const id = getSupplierId(item) || String(item.id ?? item.__directoryKey ?? "");

  if (!id) return "";

  return `/admin/suppliers/pending/${encodeURIComponent(id)}`;
}

function getSearchText(item: DirectorySupplierRecord) {
  return [
    buildSupplierSearchText(item),
    getDirectoryStatus(item),
    getSourceLabel(item),
    item.__directorySource ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export default function AdminSuppliersDirectoryView() {
  const [items, setItems] = useState<DirectorySupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<LoadWarning>({});
  const [rawCounts, setRawCounts] = useState({
    registered: 0,
    pending: 0,
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setWarnings({});

    const [registeredResult, pendingResult] = await Promise.allSettled([
      getAdminSuppliers(),
      getPendingSuppliers(),
    ]);

    const registeredSuppliers =
      registeredResult.status === "fulfilled" ? registeredResult.value ?? [] : [];

    const pendingSuppliers =
      pendingResult.status === "fulfilled" ? pendingResult.value ?? [] : [];

    const nextWarnings: LoadWarning = {};

    if (registeredResult.status === "rejected") {
      nextWarnings.registered = getAuthErrorMessage(registeredResult.reason);
    }

    if (pendingResult.status === "rejected") {
      nextWarnings.pending = getAuthErrorMessage(pendingResult.reason);
    }

    const mergedItems = mergeSupplierDirectory(registeredSuppliers, pendingSuppliers);

    setItems(mergedItems);
    setRawCounts({
      registered: registeredSuppliers.length,
      pending: pendingSuppliers.length,
    });
    setWarnings(nextWarnings);
    setLastLoadedAt(new Date().toISOString());
    setIsLoading(false);

    if (registeredResult.status === "rejected" && pendingResult.status === "rejected") {
      const message =
        "Gagal memuat directory supplier. Endpoint supplier terdaftar dan pending sama-sama gagal.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (registeredResult.status === "rejected") {
      toast.warning("Data supplier terdaftar gagal dimuat. Menampilkan pending saja.");
    }

    if (pendingResult.status === "rejected") {
      toast.warning("Data pending gagal dimuat. Menampilkan supplier terdaftar saja.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: countByFilter(items, "all"),
      registered: countByFilter(items, "registered"),
      pending: countByFilter(items, "pending"),
      approved: countByFilter(items, "approved"),
      rejected: countByFilter(items, "rejected"),
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const bucket = getDirectoryBucket(item);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "registered"
          ? bucket === "registered" || bucket === "approved"
          : bucket === statusFilter);

      const matchesQuery = !keyword || getSearchText(item).includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  const latestCreatedAt = useMemo(() => {
    if (items.length === 0) return "-";
    return formatDate(getCreatedAt(items[0]));
  }, [items]);

  const statusFilters: Array<{
    key: StatusFilter;
    label: string;
    count: number;
  }> = [
    {
      key: "all",
      label: "All",
      count: stats.total,
    },
    {
      key: "registered",
      label: "Registered",
      count: stats.registered,
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
      title="Supplier Directory"
      description="Directory admin untuk melihat semua supplier yang sudah terdaftar dan supplier yang masih pending application."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0" />
            )}
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/suppliers/pending"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
          >
            <Clock3 className="h-4 w-4 shrink-0" />
            <span>Pending Review</span>
          </Link>

          <Link
            href="/admin/suppliers/add"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low sm:w-auto"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>Add Supplier</span>
          </Link>
        </div>
      }
    >
      <div className="grid gap-5 sm:gap-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Total Directory
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {isLoading ? "-" : stats.total}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Gabungan supplier terdaftar dan pending application.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Registered
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {isLoading ? "-" : stats.registered}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Supplier yang sudah masuk directory utama admin.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-primary">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Pending
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {isLoading ? "-" : stats.pending}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Supplier yang masih perlu direview admin.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-tertiary-container p-3 text-on-tertiary-container">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Latest Entry
                </p>
                <p className="mt-3 break-words font-headline text-lg font-extrabold leading-snug text-on-surface sm:text-xl">
                  {isLoading ? "-" : latestCreatedAt}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Data terbaru dari hasil gabungan API.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-primary">
                <DatabaseZap className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        {(warnings.registered || warnings.pending) && !errorMessage ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-800 sm:p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Sebagian data tidak berhasil dimuat.</p>
                <div className="mt-2 grid gap-1 text-sm leading-6">
                  {warnings.registered ? (
                    <p>
                      <b>Registered suppliers:</b> {warnings.registered}
                    </p>
                  ) : null}
                  {warnings.pending ? (
                    <p>
                      <b>Pending suppliers:</b> {warnings.pending}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 sm:p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Directory gagal dimuat.</p>
                <p className="mt-1 text-sm leading-6">{errorMessage}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Live Supplier Directory
              </p>
              <h2 className="mt-2 break-words font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                Semua supplier terdaftar dan pending
              </h2>
              <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                Data digabung dari endpoint supplier utama dan endpoint pending.
                Duplicate berdasarkan ID, username, email, nomor HP, atau KTP akan
                dirapikan menjadi satu record.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[360px]">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama, username, email, no HP, lokasi..."
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
                <Filter className="h-4 w-4" />
                <span>{filteredItems.length} shown</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant md:grid-cols-3">
            <p>
              Last refresh:{" "}
              <span className="font-bold text-on-surface">
                {lastLoadedAt ? formatDate(lastLoadedAt) : "-"}
              </span>
            </p>
            <p>
              Raw registered API:{" "}
              <span className="font-bold text-on-surface">
                {isLoading ? "-" : rawCounts.registered}
              </span>
            </p>
            <p>
              Raw pending API:{" "}
              <span className="font-bold text-on-surface">
                {isLoading ? "-" : rawCounts.pending}
              </span>
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
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

          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Memuat supplier directory...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-6 text-sm leading-6 text-on-surface-variant">
              {items.length === 0
                ? "Belum ada data supplier yang bisa dibaca dari endpoint admin suppliers atau pending suppliers."
                : "Tidak ada hasil yang cocok dengan pencarian/filter."}
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4 md:hidden">
                {filteredItems.map((item) => {
                  const status = getDirectoryStatus(item);
                  const detailHref = getDetailHref(item);
                  const isPending = getDirectoryBucket(item) === "pending";

                  return (
                    <article
                      key={item.__directoryKey || String(item.id)}
                      className="rounded-3xl border border-outline-variant/15 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            {getApplicationCode(item)}
                          </p>
                          <p className="mt-1 break-words font-bold text-on-surface">
                            {getDisplayName(item)}
                          </p>
                          <p className="mt-1 break-all text-sm text-on-surface-variant">
                            @{getUsername(item)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold capitalize ${statusPillClass(
                            status
                          )}`}
                        >
                          {getStatusIcon(status)}
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Contact
                          </p>
                          <p className="mt-2 break-all text-sm font-medium text-on-surface">
                            {getEmail(item)}
                          </p>
                          <p className="mt-1 break-words text-sm text-on-surface-variant">
                            {getPhone(item)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Location
                          </p>
                          <p className="mt-2 break-words text-sm text-on-surface">
                            {getLocation(item)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Source
                          </p>
                          <p className="mt-2 break-words text-sm text-on-surface">
                            {getSourceLabel(item)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Created At
                          </p>
                          <p className="mt-2 break-words text-sm text-on-surface">
                            {formatDate(getCreatedAt(item))}
                          </p>
                        </div>
                      </div>

                      {detailHref ? (
                        <Link
                          href={detailHref}
                          className={
                            isPending
                              ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white"
                              : "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface"
                          }
                        >
                          {isPending ? "Review Application" : "Open Detail"}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <div className="mt-6 hidden overflow-hidden rounded-3xl border border-outline-variant/15 md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-[1040px] text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Supplier
                        </th>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Contact
                        </th>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Location
                        </th>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Status
                        </th>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Source
                        </th>
                        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Created
                        </th>
                        <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant/10 bg-white">
                      {filteredItems.map((item) => {
                        const status = getDirectoryStatus(item);
                        const detailHref = getDetailHref(item);
                        const isPending = getDirectoryBucket(item) === "pending";

                        return (
                          <tr
                            key={item.__directoryKey || String(item.id)}
                            className="transition hover:bg-surface-container-lowest"
                          >
                            <td className="px-5 py-4 align-top">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                                {getApplicationCode(item)}
                              </p>
                              <p className="mt-1 break-words text-sm font-bold text-on-surface">
                                {getDisplayName(item)}
                              </p>
                              <p className="mt-1 break-all text-xs text-on-surface-variant">
                                @{getUsername(item)}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                              <p className="flex items-center gap-2 break-all">
                                <Mail className="h-4 w-4 shrink-0" />
                                {getEmail(item)}
                              </p>
                              <p className="mt-2 flex items-center gap-2 break-words">
                                <Phone className="h-4 w-4 shrink-0" />
                                {getPhone(item)}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                              <p className="flex items-start gap-2 break-words">
                                <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                                {getLocation(item)}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${statusPillClass(
                                  status
                                )}`}
                              >
                                {getStatusIcon(status)}
                                {getStatusLabel(status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                              <span className="break-words">{getSourceLabel(item)}</span>
                            </td>

                            <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                              <p className="break-words">
                                {formatDateOnly(getCreatedAt(item))}
                              </p>
                              <p className="mt-1 text-xs">
                                {formatDate(getCreatedAt(item))}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top text-right">
                              {detailHref ? (
                                <Link
                                  href={detailHref}
                                  className={
                                    isPending
                                      ? "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
                                      : "inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-xs font-bold text-on-surface transition hover:bg-surface-container-high"
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                  {isPending ? "Review" : "Detail"}
                                </Link>
                              ) : (
                                <span className="text-xs text-on-surface-variant">
                                  No ID
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Data Source
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                Directory membaca <b className="text-on-surface">GET /api/admin/suppliers</b>{" "}
                untuk supplier terdaftar dan{" "}
                <b className="text-on-surface">GET /api/admin/suppliers/pending</b>{" "}
                untuk pending application.
              </p>
            </article>

            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Duplicate Handling
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                Record yang sama akan digabung berdasarkan ID, username, email,
                nomor HP, atau nomor KTP supaya tidak dobel di directory.
              </p>
            </article>

            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Review Flow
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                Supplier pending tetap diarahkan ke halaman detail review untuk
                approve atau reject.
              </p>
            </article>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}