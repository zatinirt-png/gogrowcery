"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Loader2,
  Package2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import { getSupplierBids } from "@/features/bounty/api";
import type {
  BountyRecord,
  SupplierBidItemRecord,
  SupplierBidRecord,
} from "@/features/bounty/types";
import SupplierShell from "./supplier-shell";

type StatusFilter = "all" | "submitted" | "under_review" | "awarded";
type DateFilter = "any" | "7d" | "30d";

const PAGE_SIZE = 6;

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

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string | null) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDateObject(value?: string | null) {
  if (!value || value === "-") return null;

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getBidItems(bid: SupplierBidRecord) {
  if (Array.isArray(bid.items)) return bid.items;
  if (Array.isArray(bid.bid_items)) return bid.bid_items;

  const dataItems = getNestedValue(bid, "data.items");
  if (Array.isArray(dataItems)) return dataItems as SupplierBidItemRecord[];

  const dataBidItems = getNestedValue(bid, "data.bid_items");
  if (Array.isArray(dataBidItems)) return dataBidItems as SupplierBidItemRecord[];

  return [];
}

function getNestedBounty(bid: SupplierBidRecord) {
  const candidates = [
    bid.bounty,
    getNestedValue(bid, "data.bounty"),
    getNestedValue(bid, "bounty.data"),
  ];

  const found = candidates.find(
    (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)
  );

  return found ? (found as BountyRecord) : null;
}

function getBountyId(bid: SupplierBidRecord) {
  const bounty = getNestedBounty(bid);

  return firstString(
    bid,
    [
      "bounty_id",
      "bountyId",
      "data.bounty_id",
      "data.bountyId",
      "bounty.id",
      "bounty.uuid",
      "data.bounty.id",
    ],
    bounty ? firstString(bounty, ["id", "uuid"], "") : ""
  );
}

function getBountyCode(bid: SupplierBidRecord, index: number) {
  const bounty = getNestedBounty(bid);

  return firstString(
    bid,
    [
      "bounty.code",
      "bounty.bounty_code",
      "data.bounty.code",
      "data.bounty.bounty_code",
      "bounty_code",
      "code",
    ],
    bounty
      ? firstString(
          bounty,
          ["code", "bounty_code", "reference", "ref_code", "id"],
          `BNT-${String(index + 1).padStart(4, "0")}`
        )
      : `BNT-${String(index + 1).padStart(4, "0")}`
  );
}

function getBountyTitle(bid: SupplierBidRecord) {
  const bounty = getNestedBounty(bid);

  return firstString(
    bid,
    ["bounty.title", "data.bounty.title", "title", "bounty_title"],
    bounty ? firstString(bounty, ["title", "name"], "Untitled Bounty") : "Untitled Bounty"
  );
}

function getBountyClient(bid: SupplierBidRecord) {
  const bounty = getNestedBounty(bid);

  return firstString(
    bid,
    [
      "bounty.client_name",
      "data.bounty.client_name",
      "client_name",
      "client.name",
      "buyer.name",
    ],
    bounty
      ? firstString(
          bounty,
          ["client_name", "client.name", "buyer.name", "customer.name"],
          "Client tidak tersedia"
        )
      : "Client tidak tersedia"
  );
}

function getBountyDescription(bid: SupplierBidRecord) {
  const bounty = getNestedBounty(bid);

  return firstString(
    bid,
    ["bounty.description", "data.bounty.description", "description", "bounty_description"],
    bounty
      ? firstString(bounty, ["description", "notes"], "Tidak ada deskripsi bounty.")
      : "Tidak ada deskripsi bounty."
  );
}

function getBountyStatus(bid: SupplierBidRecord) {
  const bounty = getNestedBounty(bid);

  return titleCase(
    firstString(
      bid,
      ["bounty.status", "data.bounty.status", "bounty_status"],
      bounty ? firstString(bounty, ["status", "publication_status"], "published") : "published"
    )
  );
}

function getBidStatusRaw(bid: SupplierBidRecord) {
  return firstString(bid, ["status", "data.status"], "submitted").toLowerCase();
}

function getBidStatusLabel(bid: SupplierBidRecord) {
  return titleCase(getBidStatusRaw(bid));
}

function getSubmittedAt(bid: SupplierBidRecord) {
  return firstString(
    bid,
    ["submitted_at", "created_at", "updated_at", "data.submitted_at", "data.created_at"],
    "-"
  );
}

function getBidNotes(bid: SupplierBidRecord) {
  return firstString(bid, ["notes", "data.notes"], "");
}

function getItemName(item: SupplierBidItemRecord, index: number) {
  return firstString(
    item,
    [
      "bounty_item.item_name",
      "bounty_item.name",
      "data.bounty_item.item_name",
      "item_name",
      "name",
    ],
    `Item ${index + 1}`
  );
}

function getItemUnit(item: SupplierBidItemRecord) {
  return firstString(item, ["bounty_item.unit", "data.bounty_item.unit", "unit"], "unit");
}

function getRequestedQty(item: SupplierBidItemRecord) {
  return parseNumber(
    getNestedValue(item, "bounty_item.target_quantity") ??
      getNestedValue(item, "data.bounty_item.target_quantity") ??
      getNestedValue(item, "bounty_item.quantity") ??
      getNestedValue(item, "requested_quantity") ??
      getNestedValue(item, "target_quantity")
  );
}

function getQuotedQty(item: SupplierBidItemRecord) {
  return parseNumber(
    item.estimasi_kuantitas ??
      item.estimated_quantity ??
      item.quantity ??
      getNestedValue(item, "data.estimasi_kuantitas")
  );
}

function getQuotedPrice(item: SupplierBidItemRecord) {
  return parseNumber(
    item.estimasi_harga ??
      item.estimated_price ??
      item.price ??
      getNestedValue(item, "data.estimasi_harga")
  );
}

function getItemGrade(item: SupplierBidItemRecord) {
  return firstString(item, ["grade", "data.grade"], "-");
}

function getBidEstimatedValue(bid: SupplierBidRecord) {
  return getBidItems(bid).reduce((total, item) => {
    return total + getQuotedQty(item) * getQuotedPrice(item);
  }, 0);
}

function getFulfillmentRate(bid: SupplierBidRecord) {
  const items = getBidItems(bid);
  const requested = items.reduce((total, item) => total + getRequestedQty(item), 0);
  const quoted = items.reduce((total, item) => total + getQuotedQty(item), 0);

  if (!requested) return 0;

  return Math.min(100, Math.round((quoted / requested) * 1000) / 10);
}

function getStatusGroup(bid: SupplierBidRecord): StatusFilter {
  const status = getBidStatusRaw(bid);

  if (["awarded", "accepted", "approved", "winner", "won"].includes(status)) {
    return "awarded";
  }

  if (
    [
      "under_review",
      "review",
      "reviewed",
      "pending",
      "pending_review",
      "waiting_for_survey",
      "survey",
      "waiting",
    ].includes(status)
  ) {
    return "under_review";
  }

  return "submitted";
}

function matchDateFilter(bid: SupplierBidRecord, filter: DateFilter) {
  if (filter === "any") return true;

  const submittedAt = getDateObject(getSubmittedAt(bid));
  if (!submittedAt) return false;

  const now = new Date();
  const diffMs = now.getTime() - submittedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (filter === "7d") return diffDays <= 7;
  if (filter === "30d") return diffDays <= 30;

  return true;
}

function getSearchHaystack(bid: SupplierBidRecord, index: number) {
  return [
    getBountyCode(bid, index),
    getBountyTitle(bid),
    getBountyClient(bid),
    getBountyDescription(bid),
    getBidStatusLabel(bid),
    getBidNotes(bid),
    getBidItems(bid)
      .map(
        (item, itemIndex) =>
          `${getItemName(item, itemIndex)} ${getItemGrade(item)} ${getQuotedQty(item)} ${getQuotedPrice(item)}`
      )
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export default function SupplierBidsWorkspace() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bids, setBids] = useState<SupplierBidRecord[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [page, setPage] = useState(1);

  const loadBids = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoadingBids(true);

    try {
      const response = await getSupplierBids();

      setBids(response);
      setErrorMessage(null);

      if (showToast) toast.success("Data My Bid diperbarui.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data bid supplier.";

      setBids([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (showToast) setIsRefreshing(false);
      else setIsLoadingBids(false);
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
        await loadBids(false);
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    return {
      all: bids.length,
      submitted: bids.filter((bid) => getStatusGroup(bid) === "submitted").length,
      underReview: bids.filter((bid) => getStatusGroup(bid) === "under_review").length,
      awarded: bids.filter((bid) => getStatusGroup(bid) === "awarded").length,
    };
  }, [bids]);

  const filteredBids = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bids.filter((bid, index) => {
      const matchesSearch =
        !keyword || getSearchHaystack(bid, index).includes(keyword);

      const matchesStatus =
        statusFilter === "all" || getStatusGroup(bid) === statusFilter;

      const matchesDate = matchDateFilter(bid, dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bids, dateFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBids.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedBids = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBids.slice(start, start + PAGE_SIZE);
  }, [filteredBids, page]);

  const showingStart = filteredBids.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, filteredBids.length);

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

  const isLoading = isLoadingUser || isLoadingBids;

  return (
    <SupplierShell
      title="My Bids"
      description="Daftar bid yang sudah diajukan supplier."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/supplier/bounties"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Package2 className="h-4 w-4" />
            New Bid
          </Link>

          <button
            type="button"
            onClick={() => loadBids(true)}
            disabled={isRefreshing || isLoadingBids}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-70"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      }
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoading ? null : (
        <main className="w-full pb-10">
          <section className="mb-8">
            <h1 className="mb-6 font-headline text-3xl font-bold tracking-tight text-on-surface">
              My Bids
            </h1>

            <div className="flex flex-wrap gap-3">
              <StatusChip
                active={statusFilter === "all"}
                label="All Bids"
                count={stats.all}
                onClick={() => setStatusFilter("all")}
              />
              <StatusChip
                active={statusFilter === "submitted"}
                label="Submitted"
                count={stats.submitted}
                onClick={() => setStatusFilter("submitted")}
              />
              <StatusChip
                active={statusFilter === "under_review"}
                label="Under Review"
                count={stats.underReview}
                onClick={() => setStatusFilter("under_review")}
              />
              <StatusChip
                active={statusFilter === "awarded"}
                label="Awarded"
                count={stats.awarded}
                onClick={() => setStatusFilter("awarded")}
              />
            </div>
          </section>

          {errorMessage ? (
            <section className="mb-8 rounded-2xl bg-error-container p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
                <div className="min-w-0">
                  <p className="font-bold text-on-error-container">
                    Data My Bid gagal dibaca
                  </p>
                  <p className="mt-1 break-words text-sm text-on-error-container">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mb-8 flex flex-col gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by bounty code, title, or client..."
                className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-12 pr-4 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="all">Status: All</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="awarded">Awarded</option>
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                className="rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-fixed-dim"
              >
                <option value="any">Date: Any</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("any");
                }}
                className="inline-flex items-center justify-center rounded-xl bg-surface-container-low px-4 py-3 text-on-surface transition hover:bg-surface-container-high"
                aria-label="Reset filters"
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </section>

          <section className="space-y-6">
            {pagedBids.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 text-center shadow-sm">
                <BriefcaseBusiness className="mx-auto h-10 w-10 text-on-surface-variant" />
                <p className="mt-4 font-bold text-on-surface">
                  Belum ada bid yang cocok
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Coba ubah filter, atau ajukan bid dari halaman Bounty Tersedia.
                </p>
                <Link
                  href="/supplier/bounties"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  Lihat Bounty Tersedia
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              pagedBids.map((bid, index) => {
                const absoluteIndex = (page - 1) * PAGE_SIZE + index;
                const bountyId = getBountyId(bid);
                const detailHref = bountyId
                  ? `/supplier/bounties/${encodeURIComponent(bountyId)}`
                  : "/supplier/bounties";

                return (
                  <BidCard
                    key={`${firstString(bid, ["id", "data.id"], "bid")}-${absoluteIndex}`}
                    bid={bid}
                    index={absoluteIndex}
                    detailHref={detailHref}
                  />
                );
              })
            )}
          </section>

          <footer className="mt-8 flex flex-col gap-4 border-t border-outline-variant/15 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-bold text-on-surface">
                {showingStart}-{showingEnd}
              </span>{" "}
              of{" "}
              <span className="font-bold text-on-surface">
                {filteredBids.length}
              </span>{" "}
              Bid
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </main>
      )}
    </SupplierShell>
  );
}

function StatusChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex items-center gap-2 rounded-full bg-primary-container px-5 py-2 text-sm font-semibold text-on-primary-container transition"
          : "flex items-center gap-2 rounded-full bg-surface-container-highest px-5 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high"
      }
    >
      <span>{label}</span>
      <span
        className={
          active
            ? "rounded-full bg-white/30 px-2 py-0.5 text-xs"
            : "rounded-full bg-surface-dim px-2 py-0.5 text-xs"
        }
      >
        {count}
      </span>
    </button>
  );
}

function BidCard({
  bid,
  index,
  detailHref,
}: {
  bid: SupplierBidRecord;
  index: number;
  detailHref: string;
}) {
  const bidItems = getBidItems(bid);
  const notes = getBidNotes(bid);
  const statusGroup = getStatusGroup(bid);

  const stripClass =
    statusGroup === "awarded"
      ? "bg-primary-container"
      : statusGroup === "under_review"
        ? "bg-tertiary"
        : "bg-primary";

  return (
    <article className="relative flex flex-col gap-6 overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${stripClass}`} />

      <div className="flex flex-col items-start justify-between gap-4 border-b border-surface-container-high pb-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <span className="font-label text-xs font-bold uppercase tracking-wider text-secondary">
              {getBountyCode(bid, index)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-1 text-xs font-medium text-on-surface-variant">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
              Bounty: {getBountyStatus(bid)}
            </span>
          </div>

          <h3 className="break-words font-headline text-lg font-bold text-on-surface">
            {getBountyTitle(bid)}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {getBountyClient(bid)}
            </span>

            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Submitted: {formatDate(getSubmittedAt(bid))}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Bid: {getBidStatusLabel(bid)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
              Description
            </h4>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {getBountyDescription(bid)}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
              Supplier Notes
            </h4>
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-3">
              <p className="text-sm italic text-on-surface-variant">
                "{notes || "Tidak ada catatan supplier."}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Items" value={String(bidItems.length)} />
            <MiniMetric label="Value" value={formatCurrency(getBidEstimatedValue(bid))} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
            Items Comparison
          </h4>

          <div className="overflow-hidden rounded-lg border border-outline-variant/15 bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                    <th className="p-3 font-semibold">Item</th>
                    <th className="p-3 text-right font-semibold">Requested</th>
                    <th className="p-3 text-right font-semibold">Quoted</th>
                    <th className="p-3 font-semibold">Details</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {bidItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-on-surface-variant"
                      >
                        Item bid belum tersedia.
                      </td>
                    </tr>
                  ) : (
                    bidItems.slice(0, 4).map((item, itemIndex) => {
                      const unit = getItemUnit(item);
                      const requestedQty = getRequestedQty(item);
                      const quotedQty = getQuotedQty(item);
                      const price = getQuotedPrice(item);

                      return (
                        <tr
                          key={`${getItemName(item, itemIndex)}-${itemIndex}`}
                          className="border-b border-surface-container-high last:border-b-0 hover:bg-surface-container-low/50"
                        >
                          <td className="p-3 font-medium text-on-surface">
                            {getItemName(item, itemIndex)}
                          </td>
                          <td className="p-3 text-right text-on-surface-variant">
                            {requestedQty > 0 ? `${requestedQty} ${unit}` : "-"}
                          </td>
                          <td className="p-3 text-right font-medium text-primary">
                            {quotedQty > 0 ? `${quotedQty} ${unit}` : "-"}
                          </td>
                          <td className="p-3 text-on-surface-variant">
                            Grade {getItemGrade(item)}, {formatCurrency(price)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {bidItems.length > 4 ? (
            <p className="mt-2 text-xs font-semibold text-secondary">
              +{bidItems.length - 4} item lainnya. Buka detail untuk melihat semua item.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-col justify-end gap-3 border-t border-surface-container-high pt-4 sm:flex-row sm:items-center">
        <Link
          href={detailHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-secondary transition hover:bg-surface-container-high"
        >
          <Edit3 className="h-4 w-4" />
          Edit Bid
        </Link>

        <Link
          href={detailHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10"
        >
          <Eye className="h-4 w-4" />
          View Bounty
        </Link>

        <Link
          href={detailHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary/90"
        >
          View Bid Detail
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 truncate font-headline text-sm font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}