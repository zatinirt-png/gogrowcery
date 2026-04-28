"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  HandCoins,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import { getAdminBounties } from "@/features/bounty/api";
import type { AdminBountyRecord, BountyItemRecord } from "@/features/bounty/types";

type AdminBountyRow = {
  id: string;
  code: string;
  clientName: string;
  title: string;
  description: string;
  deadlineAt: string;
  status: string;
  items: BountyItemRecord[];
  itemsCount: number;
  createdBy: string;
  createdAt: string;
};

function getNestedValue(source: unknown, path: string) {
  const parts = path.split(".");
  let current = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function firstString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function titleCaseStatus(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Available";

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(record: AdminBountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Available")
  );
}

function getBountyItems(record: AdminBountyRecord) {
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.bounty_items)) return record.bounty_items;

  const nestedItems = getNestedValue(record, "data.items");
  if (Array.isArray(nestedItems)) return nestedItems as BountyItemRecord[];

  return [];
}

function toAdminBountyRow(record: AdminBountyRecord, index: number): AdminBountyRow {
  const fallbackId = `bounty-${index + 1}`;
  const id = firstString(record, ["id", "uuid", "bounty_id"], fallbackId);
  const code = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id"],
    `BNT-${String(index + 1).padStart(3, "0")}`
  );
  const items = getBountyItems(record);

  return {
    id,
    code,
    clientName: firstString(
      record,
      ["client_name", "client.name", "buyer.name", "customer.name"],
      "Client tidak tersedia"
    ),
    title: firstString(record, ["title", "name"], "Untitled Bounty"),
    description: firstString(record, ["description", "notes"], "Tidak ada deskripsi."),
    deadlineAt: firstString(record, ["deadline_at", "deadline", "deadlineAt"], "-"),
    status: normalizeStatus(record),
    items,
    itemsCount: items.length,
    createdBy: firstString(
      record,
      ["created_by.name", "creator.name", "admin.name", "user.name", "created_by"],
      "-"
    ),
    createdAt: firstString(record, ["created_at", "createdAt"], "-"),
  };
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (["published", "available", "open", "active"].includes(normalized)) {
    return "bg-primary/10 text-primary";
  }

  if (["draft", "pending"].includes(normalized)) {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container";
  }

  return "bg-surface-container-high text-on-surface";
}

function formatDateLabel(value: string) {
  if (!value || value === "-") return "-";

  const isoValue = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDeadlineDate(value: string) {
  if (!value || value === "-") return null;

  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRemainingLabel(value: string, status: string) {
  const normalizedStatus = status.toLowerCase();

  if (!["published", "available", "open", "active"].includes(normalizedStatus)) {
    return normalizedStatus === "draft" ? "Belum dipublish" : "Tidak aktif";
  }

  const deadline = getDeadlineDate(value);
  if (!deadline) return "Deadline tidak valid";

  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Deadline lewat";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} jam lagi`;

  return `${Math.ceil(diffHours / 24)} hari lagi`;
}

function isUrgent(row: AdminBountyRow) {
  const normalizedStatus = row.status.toLowerCase();
  if (!["published", "available", "open", "active"].includes(normalizedStatus)) {
    return false;
  }

  const deadline = getDeadlineDate(row.deadlineAt);
  if (!deadline) return false;

  const diffDays = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 3;
}

export default function AdminBountyListView() {
  const [bounties, setBounties] = useState<AdminBountyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [clientName, setClientName] = useState("All");

  const rows = useMemo(
    () => bounties.map((record, index) => toAdminBountyRow(record, index)),
    [bounties]
  );

  const loadBounties = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await getAdminBounties();
      setBounties(response);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data bounty admin.";
      setBounties([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (mode === "initial") setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBounties("initial");
  }, []);

  const clientOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.clientName))).sort();
  }, [rows]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.status))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const searchValue = search.trim().toLowerCase();
      const haystack = [
        row.code,
        row.clientName,
        row.title,
        row.description,
        row.status,
        row.createdBy,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchValue || haystack.includes(searchValue);
      const matchesStatus = status === "All" || row.status === status;
      const matchesDeadline = deadlineDate
        ? row.deadlineAt.startsWith(deadlineDate)
        : true;
      const matchesClient = clientName === "All" || row.clientName === clientName;

      return matchesSearch && matchesStatus && matchesDeadline && matchesClient;
    });
  }, [rows, search, status, deadlineDate, clientName]);

  const stats = useMemo(() => {
    const live = rows.filter((item) =>
      ["published", "available", "open", "active"].includes(item.status.toLowerCase())
    ).length;
    const draft = rows.filter((item) => item.status.toLowerCase() === "draft").length;
    const urgent = rows.filter(isUrgent).length;

    return { total: rows.length, live, draft, urgent };
  }, [rows]);

  return (
    <AdminShell
      title="Bounties"
      description="Daftar bounty live dari API admin. Bounty yang dibuat admin akan tampil di sini setelah backend menyimpannya."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => loadBounties("refresh")}
            disabled={isLoading || isRefreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 sm:w-auto"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 shrink-0" />
            )}
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/bounties/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Create Bounty</span>
          </Link>

          <Link
            href="/admin/bounties/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low sm:w-auto"
          >
            <span>Open Create Form</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
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
                  Total Bounties
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {stats.total}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Seluruh bounty dari endpoint admin.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-primary">
                <HandCoins className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Live / Available
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {stats.live}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Bounty aktif untuk supplier.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Draft
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {stats.draft}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Bounty dengan status draft dari backend.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-secondary">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Urgent Deadline
                </p>
                <p className="mt-3 break-words font-headline text-3xl font-extrabold leading-none text-on-surface">
                  {stats.urgent}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                  Bounty aktif dengan deadline 3 hari ke depan.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-surface-container-low p-3 text-tertiary">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-error/15 bg-error-container p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
              <div className="min-w-0">
                <p className="font-bold text-on-error-container">
                  Endpoint admin bounty gagal dibaca
                </p>
                <p className="mt-1 break-words text-sm text-on-error-container">
                  {errorMessage}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_180px_180px_220px_auto] xl:items-end">
            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Search Bounties
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ID, title, client, atau status..."
                  className="w-full rounded-2xl border border-transparent bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              >
                <option value="All">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Deadline
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Client Name
              </label>
              <select
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              >
                <option value="All">All Clients</option>
                {clientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("All");
                setDeadlineDate("");
                setClientName("All");
              }}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest xl:w-auto"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-3 p-6 text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Memuat bounty dari API admin...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4 p-4 md:hidden">
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <article
                      key={row.id}
                      className="min-w-0 rounded-3xl border border-outline-variant/15 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-all font-mono text-sm font-bold text-primary">
                            {row.code}
                          </p>
                          <p className="mt-2 break-words font-semibold text-on-surface">
                            {row.clientName}
                          </p>
                          <p className="mt-1 break-words text-sm text-on-surface">
                            {row.title}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-on-surface-variant">
                        {row.description}
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Deadline
                          </p>
                          <p className="mt-2 break-words text-sm text-on-surface">
                            {formatDateLabel(row.deadlineAt)}
                          </p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            {getRemainingLabel(row.deadlineAt, row.status)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Details
                          </p>
                          <p className="mt-2 text-sm text-on-surface">
                            {row.itemsCount} items
                          </p>
                          <p className="mt-1 break-words text-sm text-on-surface-variant">
                            {row.createdBy}
                          </p>
                        </div>
                      </div>

                      {row.items.length ? (
                        <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Items
                          </p>
                          <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                            {row.items.slice(0, 4).map((item, itemIndex) => (
                              <li key={String(item.id ?? `${row.id}-${itemIndex}`)}>
                                {firstString(item, ["item_name", "name"], `Item ${itemIndex + 1}`)} — {firstString(item, ["target_quantity", "quantity", "qty"], "-")} {firstString(item, ["unit"], "")}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-outline-variant/20 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
                    Tidak ada bounty yang cocok dengan filter saat ini.
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[980px] text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Bounty Code
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Client Name
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Title
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Deadline
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Status
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Items
                      </th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Created By
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredRows.length ? (
                      filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className="bg-surface-container-lowest transition hover:bg-surface-container-low/40"
                        >
                          <td className="px-5 py-4">
                            <p className="break-all font-mono text-sm font-bold text-primary">
                              {row.code}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="break-words font-semibold text-on-surface">
                              {row.clientName}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="break-words text-sm font-medium text-on-surface">
                              {row.title}
                            </p>
                            <p className="mt-1 line-clamp-2 max-w-[280px] break-words text-xs leading-5 text-on-surface-variant">
                              {row.description}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="break-words text-sm text-on-surface">
                                {formatDateLabel(row.deadlineAt)}
                              </span>
                              <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                                {getRemainingLabel(row.deadlineAt, row.status)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-on-surface-variant">
                            {row.itemsCount} items
                          </td>

                          <td className="px-5 py-4 text-sm text-on-surface-variant">
                            <span className="break-words">{row.createdBy}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-on-surface-variant"
                        >
                          Tidak ada bounty yang cocok dengan filter saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t border-outline-variant/10 bg-surface-container-low px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-on-surface-variant">
              Menampilkan{" "}
              <span className="font-bold text-on-surface">{filteredRows.length}</span>{" "}
              dari <span className="font-bold text-on-surface">{rows.length}</span>{" "}
              bounty.
            </p>

            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Live API
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
