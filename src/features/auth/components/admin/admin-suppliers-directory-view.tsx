"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  DatabaseZap,
  Loader2,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getPendingSuppliers } from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import AdminShell from "./admin-shell";

function toRecord(item: PendingSupplierRecord): Record<string, unknown> {
  return item as Record<string, unknown>;
}

function readString(item: PendingSupplierRecord, key: string) {
  const value = toRecord(item)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getDisplayName(item: PendingSupplierRecord) {
  return (
    readString(item, "nama_lengkap") ||
    readString(item, "name") ||
    readString(item, "username") ||
    "-"
  );
}

function getUsername(item: PendingSupplierRecord) {
  return readString(item, "username") || "-";
}

function getEmail(item: PendingSupplierRecord) {
  return readString(item, "email") || "-";
}

function getPhone(item: PendingSupplierRecord) {
  return readString(item, "no_hp") || "-";
}

function getStatus(item: PendingSupplierRecord) {
  return readString(item, "status") || "pending";
}

function getSource(item: PendingSupplierRecord) {
  return (
    readString(item, "source") ||
    readString(item, "registration_source") ||
    "Pending API"
  );
}

function getLocation(item: PendingSupplierRecord) {
  const desa = readString(item, "desa");
  const kecamatan = readString(item, "kecamatan");
  const kabupaten = readString(item, "kabupaten");

  const parts = [desa, kecamatan, kabupaten].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");

  return "-";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCreatedAt(item: PendingSupplierRecord) {
  return readString(item, "created_at") || readString(item, "updated_at") || "";
}

function pillClass(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "approved") {
    return "bg-primary text-white";
  }

  if (normalized === "pending") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  if (normalized === "rejected") {
    return "bg-red-600 text-white";
  }

  return "bg-surface-container-high text-on-surface-variant";
}

export default function AdminSuppliersDirectoryView() {
  const [items, setItems] = useState<PendingSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);

    try {
      const normalized = await getPendingSuppliers();
      setItems(normalized);
      setLastLoadedAt(new Date().toISOString());
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = new Date(getCreatedAt(a)).getTime();
      const bTime = new Date(getCreatedAt(b)).getTime();

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return sortedItems;

    return sortedItems.filter((item) => {
      const haystack = [
        getDisplayName(item),
        getUsername(item),
        getEmail(item),
        getPhone(item),
        getLocation(item),
        getSource(item),
        getStatus(item),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [query, sortedItems]);

  const pendingCount = useMemo(() => items.length, [items]);

  const withLocationCount = useMemo(() => {
    return items.filter((item) => getLocation(item) !== "-").length;
  }, [items]);

  const withContactCount = useMemo(() => {
    return items.filter(
      (item) => getEmail(item) !== "-" || getPhone(item) !== "-"
    ).length;
  }, [items]);

  const latestCreatedAt = useMemo(() => {
    if (sortedItems.length === 0) return "-";
    return formatDate(getCreatedAt(sortedItems[0]));
  }, [sortedItems]);

  return (
    <AdminShell
      title="Suppliers"
      description="Halaman ini sekarang tidak lagi memakai mock. Sumber live yang dipakai adalah pending supplier API, sehingga overview tetap konsisten dengan endpoint yang memang tersedia saat ini."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <Link
            href="/admin/suppliers/pending"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Clock3 className="h-4 w-4" />
            Pending Review
          </Link>

          <Link
            href="/admin/suppliers/add"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Pending Queue
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  {isLoading ? "-" : pendingCount}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Total data live yang berhasil dibaca dari endpoint pending.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Contact Coverage
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  {isLoading ? "-" : withContactCount}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Record yang memiliki email atau nomor telepon.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Location Coverage
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  {isLoading ? "-" : withLocationCount}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Record yang memiliki desa, kecamatan, atau kabupaten.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <MapPinned className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Latest Entry
                </p>
                <p className="mt-3 font-headline text-xl font-extrabold leading-tight">
                  {isLoading ? "-" : latestCreatedAt}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Referensi entri terbaru dari data pending yang diterima.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <DatabaseZap className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Live Supplier Overview
              </p>
              <h2 className="mt-2 font-headline text-2xl font-extrabold">
                Recent supplier applications
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Halaman ini menampilkan data supplier live dari pending queue.
                Tidak ada lagi row contoh atau data palsu.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-[280px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama, username, email, lokasi..."
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-11 py-3 text-sm text-on-surface outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <Link
                href="/admin/suppliers/pending"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                Open Review Queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Last refresh:{" "}
            <span className="font-bold text-on-surface">
              {lastLoadedAt ? formatDate(lastLoadedAt) : "-"}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 text-sm text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat supplier live...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-6 text-sm text-on-surface-variant">
              {items.length === 0
                ? "Belum ada data pending yang bisa dibaca dari endpoint."
                : "Tidak ada hasil yang cocok dengan pencarian."}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-outline-variant/15">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Supplier
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Username
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Contact
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Location
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Status
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Source
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Created At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredItems.map((item) => {
                      const status = getStatus(item);

                      return (
                        <tr key={String(item.id)} className="bg-white">
                          <td className="px-5 py-4 align-top">
                            <p className="font-bold text-on-surface">
                              {getDisplayName(item)}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                            {getUsername(item)}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="space-y-1 text-sm">
                              <p className="text-on-surface">{getEmail(item)}</p>
                              <p className="text-on-surface-variant">
                                {getPhone(item)}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                            {getLocation(item)}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold capitalize ${pillClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                            {getSource(item)}
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-on-surface-variant">
                            {formatDate(getCreatedAt(item))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Current scope
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Directory ini sengaja menampilkan live scope yang tersedia dari
                pending supplier API agar tetap sesuai backend yang ada.
              </p>
            </article>

            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Review actions
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Approve dan reject tetap dilakukan dari halaman{" "}
                <span className="font-bold text-on-surface">Pending Review</span>.
              </p>
            </article>

            <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Next backend enhancement
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Jika nanti backend menambah endpoint list supplier admin, halaman
                ini bisa diperluas menjadi directory penuh tanpa perlu mock lagi.
              </p>
            </article>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}