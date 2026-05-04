"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
  Package2,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import {
  getSupplierBids,
  getSupplierBounties,
} from "@/features/bounty/api";
import type {
  SupplierBidRecord,
  SupplierBountyItem,
  SupplierBountyRecord,
} from "@/features/bounty/types";
import SupplierShell from "./supplier-shell";

const PAGE_SIZE = 8;

type DeadlineFilter = "all" | "today" | "week";
type StatusFilter = "all" | "published" | "closed";
type ParticipationFilter = "all" | "submitted" | "not_submitted";

type BidLookup = Map<string, SupplierBidRecord>;

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

function firstBoolean(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "submitted", "has_bid"].includes(normalized)) return true;
      if (["false", "0", "no", "none", "null"].includes(normalized)) return false;
    }
  }

  return undefined;
}

function normalizeComparableId(value: string) {
  return value.trim().replace(/^#/, "");
}

function titleCaseStatus(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Published";

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDateLabel(value?: string | null) {
  if (!value || value === "-") return "-";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDateObject(value?: string | null) {
  if (!value || value === "-") return null;

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDate(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

function getRawStatus(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["status", "publication_status", "approval_status", "data.status"],
    "published"
  ).toLowerCase();
}

function getDisplayStatus(record: SupplierBountyRecord) {
  return titleCaseStatus(getRawStatus(record));
}

function getStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (["published", "open", "active", "available"].includes(normalized)) {
    return "bg-primary/10 text-primary border-primary/15";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-surface-container-high text-on-surface border-outline-variant/20";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container border-error/10";
  }

  if (normalized === "draft") {
    return "bg-surface-container text-on-surface-variant border-outline-variant/20";
  }

  return "bg-surface-container-high text-on-surface border-outline-variant/20";
}

function getBountyId(record: SupplierBountyRecord, index: number) {
  return firstString(record, ["id", "uuid", "bounty_id", "data.id"], `bounty-${index + 1}`);
}

function getBountyCode(record: SupplierBountyRecord, index: number) {
  const rawCode = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "data.code", "id"],
    `BNT-${String(index + 1).padStart(4, "0")}`
  );

  return rawCode.startsWith("#") ? rawCode.slice(1) : rawCode;
}

function getBountyTitle(record: SupplierBountyRecord) {
  return firstString(record, ["title", "name", "data.title"], "Untitled Bounty");
}

function getBountyClient(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
    "Client tidak tersedia"
  );
}

function getBountyDescription(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["description", "notes", "data.description"],
    "Tidak ada deskripsi bounty."
  );
}

function getCurrentDeadline(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["deadline_at", "deadline", "deadlineAt", "extended_deadline_at", "new_deadline", "data.deadline_at"],
    "-"
  );
}

function getOriginalDeadline(record: SupplierBountyRecord) {
  return firstString(
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
}

function isDeadlineExtended(record: SupplierBountyRecord) {
  const current = getCurrentDeadline(record);
  const original = getOriginalDeadline(record);
  const status = getRawStatus(record);
  const extendedAt = firstString(
    record,
    ["extended_at", "deadline_extended_at", "data.extended_at"],
    ""
  );

  if (status.includes("extended") || Boolean(extendedAt)) return true;
  if (!original || !current || original === "-" || current === "-") return false;

  return formatDateLabel(original) !== formatDateLabel(current);
}

function getRemainingLabel(value: string, status: string) {
  const normalizedStatus = status.toLowerCase();

  if (["closed", "cancelled", "canceled", "expired"].includes(normalizedStatus)) {
    return titleCaseStatus(normalizedStatus);
  }

  const deadline = getDateObject(value);
  if (!deadline) return "Deadline tidak tersedia";

  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Deadline lewat";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `Closing in ${Math.max(diffHours, 1)}h`;

  return formatDateLabel(value);
}

function isDeadlinePassed(value: string) {
  const deadline = getDateObject(value);
  if (!deadline) return false;
  return deadline.getTime() < Date.now();
}

function getBountyItems(record: SupplierBountyRecord) {
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.bounty_items)) return record.bounty_items;

  const dataItems = getNestedValue(record, "data.items");
  if (Array.isArray(dataItems)) return dataItems as SupplierBountyItem[];

  const dataBountyItems = getNestedValue(record, "data.bounty_items");
  if (Array.isArray(dataBountyItems)) return dataBountyItems as SupplierBountyItem[];

  return [];
}

function getItemName(item: SupplierBountyItem, index: number) {
  return firstString(item, ["item_name", "name", "bounty_item.item_name"], `Item ${index + 1}`);
}

function getItemQty(item: SupplierBountyItem) {
  const quantity =
    item.target_quantity !== null && item.target_quantity !== undefined
      ? String(item.target_quantity)
      : item.quantity !== null && item.quantity !== undefined
        ? String(item.quantity)
        : item.qty !== null && item.qty !== undefined
          ? String(item.qty)
          : "-";

  const unit = typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : "";

  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

function getItemNote(item: SupplierBountyItem) {
  return firstString(item, ["notes", "description", "catatan"], "");
}

function getSearchHaystack(bounty: SupplierBountyRecord, index: number) {
  return [
    getBountyTitle(bounty),
    getBountyClient(bounty),
    getBountyDescription(bounty),
    getDisplayStatus(bounty),
    getBountyCode(bounty, index),
    getBountyItems(bounty)
      .map((item, itemIndex) => `${getItemName(item, itemIndex)} ${getItemQty(item)} ${getItemNote(item)}`)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function getBidBountyId(bid: SupplierBidRecord) {
  return firstString(
    bid,
    ["bounty_id", "bountyId", "bounty.id", "bounty.uuid", "data.bounty_id", "data.bounty.id"],
    ""
  );
}

function createBidLookup(bids: SupplierBidRecord[]) {
  const lookup: BidLookup = new Map();

  for (const bid of bids) {
    const bountyId = normalizeComparableId(getBidBountyId(bid));
    if (bountyId) lookup.set(bountyId, bid);
  }

  return lookup;
}

function getEmbeddedBid(record: SupplierBountyRecord) {
  const candidates = [
    getNestedValue(record, "bid"),
    getNestedValue(record, "my_bid"),
    getNestedValue(record, "supplier_bid"),
    getNestedValue(record, "data.bid"),
    getNestedValue(record, "data.my_bid"),
    getNestedValue(record, "data.supplier_bid"),
  ];

  const found = candidates.find(
    (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)
  );

  return found ? (found as SupplierBidRecord) : null;
}

function getSubmittedBid(
  bounty: SupplierBountyRecord,
  bidLookup: BidLookup,
  absoluteIndex: number
) {
  const embeddedBid = getEmbeddedBid(bounty);
  if (embeddedBid) return embeddedBid;

  const explicitFlag = firstBoolean(bounty, [
    "has_bid",
    "is_bid_submitted",
    "bid_submitted",
    "submitted_bid",
    "data.has_bid",
    "data.is_bid_submitted",
  ]);

  if (explicitFlag === false) return null;
  if (explicitFlag === true) return ({ status: "submitted" } satisfies SupplierBidRecord);

  const id = normalizeComparableId(getBountyId(bounty, absoluteIndex));
  return bidLookup.get(id) ?? null;
}

function getBidStatusLabel(bid: SupplierBidRecord | null) {
  if (!bid) return "Not Submitted";
  return titleCaseStatus(firstString(bid, ["status", "data.status"], "Submitted"));
}

function matchDeadlineFilter(record: SupplierBountyRecord, filter: DeadlineFilter) {
  if (filter === "all") return true;

  const deadline = getDateObject(getCurrentDeadline(record));
  if (!deadline) return false;

  const now = new Date();

  if (filter === "today") return isSameLocalDate(deadline, now);

  const sevenDays = new Date(now);
  sevenDays.setDate(now.getDate() + 7);

  return deadline >= now && deadline <= sevenDays;
}

function matchStatusFilter(record: SupplierBountyRecord, filter: StatusFilter) {
  if (filter === "all") return true;

  const status = getRawStatus(record);

  if (filter === "published") {
    return ["published", "open", "active", "available"].includes(status);
  }

  if (filter === "closed") {
    return ["closed", "completed", "done", "expired", "cancelled", "canceled"].includes(status);
  }

  return true;
}

function matchParticipationFilter(bid: SupplierBidRecord | null, filter: ParticipationFilter) {
  if (filter === "all") return true;
  if (filter === "submitted") return Boolean(bid);
  if (filter === "not_submitted") return !bid;

  return true;
}

export default function SupplierBountiesWorkspace() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bounties, setBounties] = useState<SupplierBountyRecord[]>([]);
  const [bids, setBids] = useState<SupplierBidRecord[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingBounties, setIsLoadingBounties] = useState(true);
  const [bountyError, setBountyError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("published");
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>("all");
  const [page, setPage] = useState(1);

  const bidLookup = useMemo(() => createBidLookup(bids), [bids]);

  const loadBounties = async (shouldToast = false) => {
    setIsLoadingBounties(true);

    try {
      const [bountyResponse, bidResult] = await Promise.allSettled([
        getSupplierBounties(),
        getSupplierBids(),
      ]);

      if (bountyResponse.status === "fulfilled") {
        setBounties(bountyResponse.value);
        setBountyError(null);
      } else {
        const message =
          bountyResponse.reason instanceof Error
            ? bountyResponse.reason.message
            : "Gagal memuat bounty supplier.";

        setBounties([]);
        setBountyError(message);
        toast.error(message);
      }

      if (bidResult.status === "fulfilled") {
        setBids(bidResult.value);
        setBidError(null);
      } else {
        const message =
          bidResult.reason instanceof Error
            ? bidResult.reason.message
            : "Gagal memuat data bid supplier.";

        setBids([]);
        setBidError(message);
      }

      if (shouldToast && bountyResponse.status === "fulfilled") {
        toast.success("Bounty supplier diperbarui.");
      }
    } finally {
      setIsLoadingBounties(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        const meResponse = await getMe();
        if (!isMounted) return;
        setUser(meResponse.user);
      } catch (error) {
        clearAuthSession();
        toast.error(getAuthErrorMessage(error));
        router.replace("/login");
        router.refresh();
        return;
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }

      if (isMounted) {
        await loadBounties(false);
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [search, deadlineFilter, statusFilter, participationFilter]);

  const bountiesWithBid = useMemo(() => {
    return bounties.map((bounty, index) => ({
      bounty,
      absoluteIndex: index,
      bid: getSubmittedBid(bounty, bidLookup, index),
    }));
  }, [bidLookup, bounties]);

  const filteredBounties = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bountiesWithBid.filter(({ bounty, bid, absoluteIndex }) => {
      const matchesSearch =
        !keyword || getSearchHaystack(bounty, absoluteIndex).includes(keyword);

      return (
        matchesSearch &&
        matchDeadlineFilter(bounty, deadlineFilter) &&
        matchStatusFilter(bounty, statusFilter) &&
        matchParticipationFilter(bid, participationFilter)
      );
    });
  }, [bountiesWithBid, deadlineFilter, participationFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBounties.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedBounties = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBounties.slice(start, start + PAGE_SIZE);
  }, [filteredBounties, page]);

  const showingStart =
    filteredBounties.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, filteredBounties.length);

  const stats = useMemo(() => {
    const total = bounties.length;
    const published = bounties.filter((bounty) => matchStatusFilter(bounty, "published")).length;
    const submitted = bountiesWithBid.filter(({ bid }) => Boolean(bid)).length;

    return { total, published, submitted };
  }, [bounties, bountiesWithBid]);

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

  const headerActions = (
    <button
      type="button"
      onClick={() => loadBounties(true)}
      disabled={isLoadingBounties}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      <RefreshCw className={`h-4 w-4 ${isLoadingBounties ? "animate-spin" : ""}`} />
      Refresh Bounties
    </button>
  );

  return (
    <SupplierShell
      title="The Precision Harvest"
      description="Supplier procurement portal untuk melihat bounty aktif dan mengajukan bid bahan pangan."
      actions={headerActions}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounties ? null : (
        <div className="w-full pb-6">
          <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                Procurement Engine
              </span>

              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                Available Bounties
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-8 text-secondary md:text-lg">
                Explore open procurement requests from verified regional distributors
                and fulfill high-volume fresh produce orders.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
              <Metric label="Total" value={stats.total} />
              <Metric label="Published" value={stats.published} />
              <Metric label="Submitted" value={stats.submitted} />
            </div>
          </section>

          {bountyError ? (
            <section className="mb-8 rounded-2xl bg-error-container p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
                <div className="min-w-0">
                  <p className="font-bold text-on-error-container">
                    Endpoint bounty supplier gagal dibaca
                  </p>
                  <p className="mt-1 break-words text-sm text-on-error-container">
                    {bountyError}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {bidError ? (
            <section className="mb-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div className="min-w-0">
                  <p className="font-bold text-on-surface">Data partisipasi bid belum terbaca</p>
                  <p className="mt-1 break-words text-sm text-on-surface-variant">
                    Halaman bounty tetap ditampilkan. Filter Submitted/Not Submitted akan akurat setelah endpoint <code className="rounded bg-surface-container px-1 py-0.5">/api/supplier/bids</code> berhasil mengirim data. Detail: {bidError}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by code or title..."
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-3 pl-12 pr-4 text-sm text-on-surface shadow-sm outline-none transition placeholder:text-outline focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1 shadow-sm">
              <select
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilter)}
                className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-sm font-semibold text-on-surface outline-none focus:ring-0"
              >
                <option value="all">Deadline: All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1 shadow-sm">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-sm font-semibold text-on-surface outline-none focus:ring-0"
              >
                <option value="published">Bounty Status: Published</option>
                <option value="closed">Closed</option>
                <option value="all">All Status</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1 shadow-sm">
              <select
                value={participationFilter}
                onChange={(event) => setParticipationFilter(event.target.value as ParticipationFilter)}
                className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-sm font-semibold text-on-surface outline-none focus:ring-0"
              >
                <option value="all">Participation: All</option>
                <option value="submitted">Submitted</option>
                <option value="not_submitted">Not Submitted</option>
              </select>
            </div>
          </section>

          <section className="space-y-4">
            {pagedBounties.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center shadow-sm">
                <Package2 className="mx-auto h-9 w-9 text-on-surface-variant" />
                <p className="mt-4 font-bold text-on-surface">Bounty belum tersedia</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Tidak ada bounty yang cocok dengan filter saat ini.
                </p>
              </div>
            ) : (
              pagedBounties.map(({ bounty, bid, absoluteIndex }) => {
                const id = getBountyId(bounty, absoluteIndex);
                const detailHref = `/supplier/bounties/${encodeURIComponent(id)}`;
                const items = getBountyItems(bounty);
                const statusLabel = getDisplayStatus(bounty);
                const deadline = getCurrentDeadline(bounty);
                const originalDeadline = getOriginalDeadline(bounty);
                const isExtended = isDeadlineExtended(bounty);
                const isOverdue = isDeadlinePassed(deadline);
                const visibleItems = items.slice(0, 4);
                const hiddenItemCount = Math.max(0, items.length - visibleItems.length);
                const bidStatusLabel = getBidStatusLabel(bid);

                return (
                  <article
                    key={`${id}-${absoluteIndex}`}
                    className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-colors hover:border-outline-variant/60 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                            {getBountyCode(bounty, absoluteIndex)}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(statusLabel)}`}
                          >
                            {statusLabel}
                          </span>

                          <span
                            className={
                              bid
                                ? "inline-flex items-center gap-1 rounded-md bg-secondary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container"
                                : "inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
                            }
                          >
                            {bid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {bidStatusLabel}
                          </span>
                        </div>

                        <h3 className="break-words font-headline text-xl font-bold text-on-surface">
                          {getBountyTitle(bounty)}
                        </h3>

                        <p className="mt-1 break-words text-sm font-semibold text-secondary">
                          {getBountyClient(bounty)}
                        </p>
                      </div>

                      <div className="shrink-0 text-left md:text-right">
                        {isExtended && originalDeadline ? (
                          <p className="text-xs font-semibold text-error line-through decoration-error/50">
                            {formatDateLabel(originalDeadline)}
                          </p>
                        ) : null}

                        <p
                          className={
                            isOverdue
                              ? "mt-0.5 flex items-center gap-1.5 text-sm font-bold text-error md:justify-end"
                              : "mt-0.5 flex items-center gap-1.5 text-sm font-bold text-on-surface md:justify-end"
                          }
                        >
                          <Clock3 className="h-4 w-4 text-tertiary" />
                          {formatDateLabel(deadline)}
                          {isExtended ? " (Extended)" : ""}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant md:justify-end">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {getRemainingLabel(deadline, getRawStatus(bounty))}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-on-surface-variant">
                      {getBountyDescription(bounty)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {visibleItems.length === 0 ? (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface-variant">
                          <Package2 className="h-4 w-4 text-primary" />
                          Item belum tersedia
                        </div>
                      ) : (
                        visibleItems.map((item, itemIndex) => {
                          const note = getItemNote(item);

                          return (
                            <div
                              key={`${getItemName(item, itemIndex)}-${itemIndex}`}
                              className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface-variant"
                            >
                              <Leaf className="h-4 w-4 shrink-0 text-primary" />
                              <span className="break-words">{getItemName(item, itemIndex)}</span>
                              <span className="font-bold text-on-surface">{getItemQty(item)}</span>
                              {note ? (
                                <span className="rounded-md bg-surface-container px-2 py-0.5 text-xs font-medium italic text-secondary">
                                  Note: {note}
                                </span>
                              ) : null}
                            </div>
                          );
                        })
                      )}

                      {hiddenItemCount > 0 ? (
                        <span className="inline-flex items-center rounded-xl bg-surface-container px-3 py-2 text-sm font-bold text-secondary">
                          +{hiddenItemCount} item lainnya
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
                      <Link
                        href={detailHref}
                        className="inline-flex items-center justify-center rounded-xl border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5"
                      >
                        View Detail
                      </Link>

                      <Link
                        href={detailHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                      >
                        {bid ? "View My Bid" : "Submit Bid"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="relative mt-12 overflow-hidden rounded-[2rem] bg-on-surface p-7 text-surface shadow-sm md:p-8">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
            <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Supplier Bid Control
                </div>

                <h3 className="font-headline text-3xl font-bold">Prioritaskan bounty yang paling siap dipenuhi</h3>

                <p className="mt-4 max-w-xl text-base leading-8 text-surface/70 md:text-lg">
                  Gunakan filter participation untuk memisahkan bounty yang sudah kamu ajukan bid dan bounty yang masih perlu ditindaklanjuti.
                </p>

                <button
                  type="button"
                  onClick={() => setParticipationFilter("not_submitted")}
                  className="mt-6 rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container transition hover:scale-[1.02]"
                >
                  View Not Submitted
                </button>
              </div>

              <div className="relative h-56 overflow-hidden rounded-2xl bg-primary/15">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(74,225,118,0.55),transparent_34%),radial-gradient(circle_at_70%_68%,rgba(34,197,94,0.45),transparent_38%)]" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {stats.submitted} submitted bids
                      </p>
                      <p className="mt-1 text-xs text-white/70">
                        From {stats.total} available bounty records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-10 flex flex-col gap-4 border-t border-outline-variant/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-secondary">
              Showing {showingStart}-{showingEnd} of {filteredBounties.length} Bounties
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={
                      page === pageNumber
                        ? "flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white"
                        : "flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-sm font-bold text-secondary transition hover:bg-surface-container-high"
                    }
                    aria-label={`Page ${pageNumber}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 5 ? (
                <span className="flex h-10 items-center px-2 text-sm font-bold text-secondary">...</span>
              ) : null}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </SupplierShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-container-low px-4 py-3">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
}