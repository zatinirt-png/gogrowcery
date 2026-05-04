"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Gavel,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import { getAdminBounties } from "@/features/bounty/api";
import type { AdminBountyRecord, BountyItemRecord } from "@/features/bounty/types";

const PAGE_SIZE = 10;

type BidStatusFilter = "all" | "has_bid" | "no_bid";

type AdminBountyRow = {
  id: string;
  code: string;
  clientName: string;
  title: string;
  description: string;
  deadlineAt: string;
  originalDeadlineAt: string;
  isExtended: boolean;
  status: string;
  items: BountyItemRecord[];
  itemsCount: number;
  totalBids: number;
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

function firstNumber(source: unknown, paths: string[], fallback = 0) {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function titleCaseStatus(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Draft";

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(record: AdminBountyRecord) {
  return titleCaseStatus(
    firstString(
      record,
      ["status", "publication_status", "approval_status", "data.status"],
      "Draft"
    )
  );
}

function getBountyItems(record: AdminBountyRecord) {
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.bounty_items)) return record.bounty_items;

  const nestedItems = getNestedValue(record, "data.items");
  if (Array.isArray(nestedItems)) return nestedItems as BountyItemRecord[];

  const nestedBountyItems = getNestedValue(record, "data.bounty_items");
  if (Array.isArray(nestedBountyItems)) return nestedBountyItems as BountyItemRecord[];

  return [];
}

function getTotalBids(record: AdminBountyRecord) {
  const direct = firstNumber(
    record,
    [
      "total_bids",
      "bids_count",
      "bid_count",
      "total_bid",
      "data.total_bids",
      "data.bids_count",
      "data.bid_count",
      "meta.total_bids",
    ],
    -1
  );

  if (direct >= 0) return direct;

  const bids = getNestedValue(record, "bids");
  if (Array.isArray(bids)) return bids.length;

  const dataBids = getNestedValue(record, "data.bids");
  if (Array.isArray(dataBids)) return dataBids.length;

  return 0;
}

function toAdminBountyRow(record: AdminBountyRecord, index: number): AdminBountyRow {
  const fallbackId = `bounty-${index + 1}`;
  const id = firstString(record, ["id", "uuid", "bounty_id", "data.id"], fallbackId);

  const code = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "data.code", "id"],
    `BNT-${String(index + 1).padStart(4, "0")}`
  );

  const items = getBountyItems(record);
  const deadlineAt = firstString(
    record,
    [
      "deadline_at",
      "deadline",
      "deadlineAt",
      "extended_deadline_at",
      "new_deadline",
      "data.deadline_at",
    ],
    "-"
  );

  const originalDeadlineAt = firstString(
    record,
    [
      "original_deadline_at",
      "previous_deadline_at",
      "old_deadline_at",
      "initial_deadline_at",
      "data.original_deadline_at",
    ],
    ""
  );

  return {
    id,
    code,
    clientName: firstString(
      record,
      ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
      "Client tidak tersedia"
    ),
    title: firstString(record, ["title", "name", "data.title"], "Untitled Bounty"),
    description: firstString(
      record,
      ["description", "notes", "data.description"],
      "Tidak ada deskripsi."
    ),
    deadlineAt,
    originalDeadlineAt,
    isExtended:
      Boolean(originalDeadlineAt) &&
      originalDeadlineAt !== "-" &&
      formatDateOnly(originalDeadlineAt) !== formatDateOnly(deadlineAt),
    status: normalizeStatus(record),
    items,
    itemsCount: items.length,
    totalBids: getTotalBids(record),
    createdBy: firstString(
      record,
      [
        "created_by.name",
        "creator.name",
        "admin.name",
        "user.name",
        "created_by",
        "data.created_by.name",
      ],
      "-"
    ),
    createdAt: firstString(record, ["created_at", "createdAt", "data.created_at"], "-"),
  };
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (["published", "available", "open", "active"].includes(normalized)) {
    return "bg-green-100 text-green-800";
  }

  if (["draft", "pending"].includes(normalized)) {
    return "bg-slate-100 text-slate-600";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-orange-100 text-orange-800";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container";
  }

  return "bg-surface-container-high text-on-surface";
}

function formatDateOnly(value: string) {
  if (!value || value === "-") return "-";

  const isoValue = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
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
  if (diffHours < 24) return `${Math.max(diffHours, 1)} jam lagi`;

  return `${Math.ceil(diffHours / 24)} hari lagi`;
}

function getItemQuantityLabel(item: BountyItemRecord) {
  const quantity = firstString(item, ["target_quantity", "quantity", "qty"], "-");
  const unit = firstString(item, ["unit"], "");

  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

function getItemName(item: BountyItemRecord, index: number) {
  return firstString(item, ["item_name", "name"], `Item ${index + 1}`);
}

function getItemsPreview(row: AdminBountyRow) {
  if (!row.items.length) return "Item belum tersedia";

  const preview = row.items
    .slice(0, 2)
    .map((item, index) => `${getItemName(item, index)} ${getItemQuantityLabel(item)}`)
    .join(", ");

  const rest = row.items.length - 2;

  return rest > 0 ? `${preview}, +${rest} item` : preview;
}

export default function AdminBountyListView() {
  const [bounties, setBounties] = useState<AdminBountyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [bidStatus, setBidStatus] = useState<BidStatusFilter>("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () => bounties.map((record, index) => toAdminBountyRow(record, index)),
    [bounties]
  );

  const statusOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.status))).sort();
  }, [rows]);

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

  useEffect(() => {
    setPage(1);
  }, [search, status, bidStatus]);

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
        getItemsPreview(row),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchValue || haystack.includes(searchValue);
      const matchesStatus = status === "All" || row.status === status;

      const matchesBidStatus =
        bidStatus === "all" ||
        (bidStatus === "has_bid" && row.totalBids > 0) ||
        (bidStatus === "no_bid" && row.totalBids <= 0);

      return matchesSearch && matchesStatus && matchesBidStatus;
    });
  }, [rows, search, status, bidStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const stats = useMemo(() => {
    const published = rows.filter((item) =>
      ["published", "available", "open", "active"].includes(item.status.toLowerCase())
    ).length;

    const draft = rows.filter((item) => item.status.toLowerCase() === "draft").length;
    const withBids = rows.filter((item) => item.totalBids > 0).length;

    return {
      total: rows.length,
      published,
      draft,
      withBids,
    };
  }, [rows]);

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setBidStatus("all");
    setPage(1);
  };

  const showingStart = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, filteredRows.length);

  return (
    <AdminShell
      title="Bounty"
      description="Curate and oversee active agricultural procurement requests."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => loadBounties("refresh")}
            disabled={isLoading || isRefreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-70 sm:w-auto"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </Link>
        </div>
      }
    >
      <div className="w-full space-y-8">
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <nav className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              <span>Portal</span>
              <span>/</span>
              <span>Management</span>
            </nav>

            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              Bounty
            </h1>

            <p className="mt-2 text-lg text-on-surface-variant">
              Curate and oversee active agricultural procurement requests.
            </p>
          </div>

          <Link
            href="/admin/bounties/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            Create Bounty
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Bounties" value={stats.total} tone="default" />
          <KpiCard label="Published" value={stats.published} tone="primary" />
          <KpiCard label="Draft" value={stats.draft} tone="secondary" />
          <KpiCard label="With Bids" value={stats.withBids} tone="default" />
        </section>

        {errorMessage ? (
          <section className="rounded-2xl border border-error/15 bg-error-container p-5 shadow-sm">
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

        <section className="flex flex-wrap items-end gap-4 rounded-2xl bg-surface-container-low p-5 shadow-sm md:p-6">
          <div className="min-w-[240px] flex-1">
            <label className="mb-2 ml-1 block text-xs font-bold uppercase text-on-surface-variant">
              Search Bounties
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ID, Title or Client..."
                className="w-full rounded-xl border-none bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
              />
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="mb-2 ml-1 block text-xs font-bold uppercase text-on-surface-variant">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
            >
              <option value="All">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <label className="mb-2 ml-1 block text-xs font-bold uppercase text-on-surface-variant">
              Bid Status
            </label>
            <select
              value={bidStatus}
              onChange={(event) => setBidStatus(event.target.value as BidStatusFilter)}
              className="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
            >
              <option value="all">All Bid Statuses</option>
              <option value="has_bid">Has Bid</option>
              <option value="no_bid">No Bid</option>
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-6 py-3 font-semibold text-on-surface transition hover:bg-surface-container-highest md:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-sm">
          {isLoading ? (
            <div className="p-6">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memuat bounty admin...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-variant bg-surface-container-low">
                      <Th>Bounty Code</Th>
                      <Th>Title & Client</Th>
                      <Th>Description</Th>
                      <Th>Items Preview</Th>
                      <Th>Deadline</Th>
                      <Th>Total Bids</Th>
                      <Th>Created By</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-surface-variant">
                    {pagedRows.length ? (
                      pagedRows.map((row) => (
                        <tr
                          key={row.id}
                          className="group transition-colors hover:bg-surface-container-low/50"
                        >
                          <td className="px-6 py-4 align-middle">
                            <span className="whitespace-nowrap font-mono text-xs font-bold text-primary">
                              {row.code}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            <div className="flex max-w-[260px] flex-col">
                              <span className="line-clamp-2 text-sm font-semibold text-on-surface">
                                {row.title}
                              </span>
                              <span className="mt-1 line-clamp-1 text-xs text-on-surface-variant">
                                {row.clientName}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-[220px] px-6 py-4 align-middle">
                            <p className="line-clamp-2 text-sm text-on-surface-variant">
                              {row.description}
                            </p>
                          </td>

                          <td className="max-w-[260px] px-6 py-4 align-middle">
                            <span className="line-clamp-2 text-sm text-on-surface">
                              {getItemsPreview(row)}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="whitespace-nowrap text-sm text-on-surface">
                                  {formatDateLabel(row.deadlineAt)}
                                </span>
                                {row.isExtended ? (
                                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                                ) : null}
                              </div>
                              <span className="whitespace-nowrap text-[11px] font-semibold text-on-surface-variant">
                                {getRemainingLabel(row.deadlineAt, row.status)}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            {row.totalBids > 0 ? (
                              <span className="inline-flex items-center rounded-md bg-secondary-container px-2 py-1 text-xs font-bold text-on-secondary-container">
                                {row.totalBids} Bid{row.totalBids > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-sm text-on-surface-variant">0 Bids</span>
                            )}
                          </td>

                          <td className="px-6 py-4 align-middle">
                            <span className="line-clamp-1 text-sm text-on-surface">
                              {row.createdBy}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle">
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ${statusClass(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                              <IconAction
                                href={`/admin/bounties/${encodeURIComponent(row.id)}`}
                                title="View Detail"
                                tone="primary"
                              >
                                <Eye className="h-5 w-5" />
                              </IconAction>

                              <IconAction
                                href={`/admin/bounties/${encodeURIComponent(row.id)}?mode=edit`}
                                title="Edit"
                                tone="secondary"
                              >
                                <Edit3 className="h-5 w-5" />
                              </IconAction>

                              <IconAction
                                href={`/admin/bounties/${encodeURIComponent(row.id)}`}
                                title="Bids"
                                tone="muted"
                              >
                                <Gavel className="h-5 w-5" />
                              </IconAction>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-12 text-center text-sm text-on-surface-variant"
                        >
                          Tidak ada bounty yang cocok dengan filter saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {pagedRows.length ? (
                  pagedRows.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-outline-variant/15 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-primary">
                            {row.code}
                          </p>
                          <h3 className="mt-2 break-words font-headline text-lg font-bold text-on-surface">
                            {row.title}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                            {row.clientName}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                        {row.description}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MobileInfo label="Items" value={getItemsPreview(row)} />
                        <MobileInfo
                          label="Deadline"
                          value={formatDateLabel(row.deadlineAt)}
                        />
                        <MobileInfo
                          label="Total Bids"
                          value={`${row.totalBids} Bid${row.totalBids > 1 ? "s" : ""}`}
                        />
                        <MobileInfo label="Created By" value={row.createdBy} />
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-outline-variant/10 pt-4">
                        <Link
                          href={`/admin/bounties/${encodeURIComponent(row.id)}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>

                        <Link
                          href={`/admin/bounties/${encodeURIComponent(row.id)}?mode=edit`}
                          className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-3 py-2 text-xs font-bold text-on-surface"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
                    Tidak ada bounty yang cocok dengan filter saat ini.
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-lowest px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-medium text-on-surface-variant">
              Showing{" "}
              <span className="font-bold text-on-surface">
                {showingStart}-{showingEnd}
              </span>{" "}
              of{" "}
              <span className="font-bold text-on-surface">
                {filteredRows.length}
              </span>{" "}
              bounties
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-xs font-bold text-on-primary-container">
                {page}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "primary" | "secondary";
}) {
  const valueClass =
    tone === "primary"
      ? "text-primary"
      : tone === "secondary"
        ? "text-secondary"
        : "text-on-surface";

  return (
    <article className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm">
      <p className="mb-1 text-sm font-medium text-on-surface-variant">{label}</p>
      <div className="flex items-end gap-3">
        <h3 className={`font-headline text-3xl font-black ${valueClass}`}>{value}</h3>
      </div>
    </article>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant ${className}`}
    >
      {children}
    </th>
  );
}

function IconAction({
  href,
  title,
  tone,
  children,
}: {
  href: string;
  title: string;
  tone: "primary" | "secondary" | "muted";
  children: React.ReactNode;
}) {
  const className =
    tone === "primary"
      ? "text-primary hover:bg-primary-container/20"
      : tone === "secondary"
        ? "text-secondary hover:bg-secondary-container"
        : "text-on-surface-variant hover:bg-surface-container-high";

  return (
    <Link
      href={href}
      title={title}
      className={`inline-flex rounded-lg p-1.5 transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-on-surface">
        {value}
      </p>
    </div>
  );
}