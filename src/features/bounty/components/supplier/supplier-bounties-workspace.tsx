"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import { getSupplierBounties } from "@/features/bounty/api";
import type {
  SupplierBountyItem,
  SupplierBountyRecord,
} from "@/features/bounty/types";
import SupplierShell from "./supplier-shell";

const PAGE_SIZE = 10;

type DeadlineFilter = "all" | "today" | "week" | "extended";
type StatusFilter = "open" | "urgent" | "verified" | "all";

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

function resolveStatus(record: SupplierBountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Available")
  );
}

function getItemName(item: SupplierBountyItem, index: number) {
  return firstString(item, ["item_name", "name"], `Item ${index + 1}`);
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

  const unit =
    typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : "";

  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

function getBountyId(record: SupplierBountyRecord, index: number) {
  return firstString(record, ["id", "uuid", "bounty_id", "data.id"], `bounty-${index + 1}`);
}

function getBountyCode(record: SupplierBountyRecord, index: number) {
  const rawCode = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.id"],
    `BTY-${String(index + 1).padStart(4, "0")}`
  );

  return rawCode.startsWith("#") ? rawCode : `#${rawCode}`;
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

function getDeadline(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["deadline_at", "deadline", "deadlineAt", "data.deadline_at"],
    "-"
  );
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
  if (diffHours < 24) return `Closing in ${Math.max(diffHours, 1)}h`;

  return formatDateLabel(value);
}

function isOpenBounty(record: SupplierBountyRecord) {
  const status = resolveStatus(record).toLowerCase();
  return ["published", "available", "open", "active", "verified"].includes(status);
}

function isUrgentBounty(record: SupplierBountyRecord) {
  if (!isOpenBounty(record)) return false;

  const deadline = getDeadlineDate(getDeadline(record));
  if (!deadline) return false;

  const diffDays = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 1;
}

function isVerifiedBounty(record: SupplierBountyRecord) {
  const status = resolveStatus(record).toLowerCase();
  const verificationStatus = firstString(
    record,
    ["verification_status", "verified_status", "data.verification_status"],
    ""
  ).toLowerCase();

  const rawVerified = getNestedValue(record, "is_verified") ?? getNestedValue(record, "verified");

  return (
    status === "verified" ||
    verificationStatus === "verified" ||
    verificationStatus === "true" ||
    rawVerified === true
  );
}

function isExtendedBounty(record: SupplierBountyRecord) {
  const status = resolveStatus(record).toLowerCase();
  const extendedAt = firstString(
    record,
    ["extended_at", "deadline_extended_at", "data.extended_at"],
    ""
  );

  return status.includes("extended") || Boolean(extendedAt);
}

function isSameLocalDate(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

function matchDeadlineFilter(record: SupplierBountyRecord, filter: DeadlineFilter) {
  if (filter === "all") return true;
  if (filter === "extended") return isExtendedBounty(record);

  const deadline = getDeadlineDate(getDeadline(record));
  if (!deadline) return false;

  const now = new Date();

  if (filter === "today") {
    return isSameLocalDate(deadline, now);
  }

  if (filter === "week") {
    const sevenDays = new Date(now);
    sevenDays.setDate(now.getDate() + 7);

    return deadline >= now && deadline <= sevenDays;
  }

  return true;
}

function matchStatusFilter(record: SupplierBountyRecord, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "open") return isOpenBounty(record);
  if (filter === "urgent") return isUrgentBounty(record);
  if (filter === "verified") return isVerifiedBounty(record);

  return true;
}

function getDisplayStatus(record: SupplierBountyRecord) {
  if (isUrgentBounty(record)) return "Urgent";
  if (isVerifiedBounty(record)) return "Verified";

  const status = resolveStatus(record).toLowerCase();

  if (["published", "available", "open", "active"].includes(status)) {
    return "Open";
  }

  return titleCaseStatus(status);
}

function getStatusBadgeClass(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "urgent") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  if (normalized === "verified") {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (normalized === "open") {
    return "bg-primary/10 text-primary";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-surface-container-high text-on-surface";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container";
  }

  return "bg-surface-container-high text-on-surface";
}

function getStatusDotClass(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "urgent") return "bg-tertiary animate-pulse";
  if (normalized === "verified") return "bg-secondary";
  if (normalized === "open") return "bg-primary animate-pulse";

  return "bg-on-surface-variant";
}

function getPrimaryItemLabel(items: SupplierBountyItem[]) {
  if (items.length === 0) return "No items";

  if (items.length === 1) {
    return getItemQty(items[0]);
  }

  return `${items.length} Items`;
}

function getSearchHaystack(bounty: SupplierBountyRecord, index: number) {
  return [
    getBountyTitle(bounty),
    getBountyClient(bounty),
    getBountyDescription(bounty),
    resolveStatus(bounty),
    getBountyCode(bounty, index),
    getBountyItems(bounty)
      .map((item, itemIndex) => `${getItemName(item, itemIndex)} ${getItemQty(item)}`)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export default function SupplierBountiesWorkspace() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bounties, setBounties] = useState<SupplierBountyRecord[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingBounties, setIsLoadingBounties] = useState(true);
  const [bountyError, setBountyError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [page, setPage] = useState(1);

  const loadBounties = async () => {
    setIsLoadingBounties(true);

    try {
      const bountyResponse = await getSupplierBounties();
      setBounties(bountyResponse);
      setBountyError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat bounty supplier.";

      setBounties([]);
      setBountyError(message);
      toast.error(message);
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
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }

      try {
        const bountyResponse = await getSupplierBounties();
        if (!isMounted) return;
        setBounties(bountyResponse);
        setBountyError(null);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error ? error.message : "Gagal memuat bounty supplier.";

        setBounties([]);
        setBountyError(message);
        toast.error(message);
      } finally {
        if (isMounted) setIsLoadingBounties(false);
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [search, deadlineFilter, statusFilter]);

  const filteredBounties = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bounties.filter((bounty, index) => {
      const matchesSearch =
        !keyword || getSearchHaystack(bounty, index).includes(keyword);

      const matchesDeadline = matchDeadlineFilter(bounty, deadlineFilter);
      const matchesStatus = matchStatusFilter(bounty, statusFilter);

      return matchesSearch && matchesDeadline && matchesStatus;
    });
  }, [bounties, search, deadlineFilter, statusFilter]);

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
    const open = bounties.filter(isOpenBounty).length;
    const urgent = bounties.filter(isUrgentBounty).length;

    const totalItems = bounties.reduce((acc, bounty) => {
      return acc + getBountyItems(bounty).length;
    }, 0);

    return { total, open, urgent, totalItems };
  }, [bounties]);

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
      onClick={loadBounties}
      disabled={isLoadingBounties}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh Bounties
    </button>
  );

  return (
    <SupplierShell
      title="The Precision Harvest"
      description="Supplier procurement portal untuk melihat bounty aktif dan peluang permintaan bahan pangan."
      actions={headerActions}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounties ? null : (
        <div className="w-full">
          <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                Procurement Engine
              </span>

              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                Available Bounties
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-8 text-secondary md:text-lg">
                Explore open procurement requests from verified regional buyers and
                fulfill high-volume fresh produce orders.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
              <Metric label="Total" value={stats.total} />
              <Metric label="Open" value={stats.open} />
              <Metric label="Urgent" value={stats.urgent} />
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

          <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search bounties by ID, client, product..."
                className="w-full rounded-xl border border-transparent bg-surface-container-lowest py-4 pl-12 pr-4 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary/20 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center rounded-xl bg-surface-container-lowest p-1 shadow-sm">
              <select
                value={deadlineFilter}
                onChange={(event) =>
                  setDeadlineFilter(event.target.value as DeadlineFilter)
                }
                className="w-full rounded-lg border-none bg-transparent px-4 py-3 text-sm font-semibold text-on-surface outline-none focus:ring-0"
              >
                <option value="all">Deadline: All Time</option>
                <option value="today">Closing Today</option>
                <option value="week">Within 7 Days</option>
                <option value="extended">Extended Bounties</option>
              </select>
            </div>

            <div className="flex items-center rounded-xl bg-surface-container-lowest p-1 shadow-sm">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="w-full rounded-lg border-none bg-transparent px-4 py-3 text-sm font-semibold text-on-surface outline-none focus:ring-0"
              >
                <option value="open">Status: Open</option>
                <option value="urgent">Urgent Only</option>
                <option value="verified">Verified Only</option>
                <option value="all">All Status</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <div className="hidden grid-cols-12 px-6 py-3 lg:grid">
              <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                Bounty Code
              </div>
              <div className="col-span-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                Bounty Title & Client
              </div>
              <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                Items
              </div>
              <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                Deadline
              </div>
              <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                Status
              </div>
              <div className="col-span-1" />
            </div>

            {pagedBounties.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm">
                <Package2 className="mx-auto h-9 w-9 text-on-surface-variant" />
                <p className="mt-4 font-bold text-on-surface">Bounty belum tersedia</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Tidak ada bounty yang cocok dengan filter saat ini.
                </p>
              </div>
            ) : (
              pagedBounties.map((bounty, index) => {
                const absoluteIndex = (page - 1) * PAGE_SIZE + index;
                const id = getBountyId(bounty, absoluteIndex);
                const items = getBountyItems(bounty);
                const statusLabel = getDisplayStatus(bounty);
                const deadline = getDeadline(bounty);
                const primaryItem = getPrimaryItemLabel(items);

                return (
                  <Link
                    key={`${id}-${absoluteIndex}`}
                    href={`/supplier/bounties/${encodeURIComponent(id)}`}
                    className="group block rounded-xl border border-transparent bg-surface-container-lowest px-5 py-5 shadow-sm transition-all hover:border-outline-variant/20 hover:bg-surface-container-low lg:grid lg:grid-cols-12 lg:items-center lg:px-6"
                  >
                    <div className="lg:col-span-2">
                      <span className="inline-flex rounded-md bg-primary/5 px-2 py-1 font-mono text-xs font-bold text-primary">
                        {getBountyCode(bounty, absoluteIndex)}
                      </span>
                    </div>

                    <div className="mt-4 min-w-0 lg:col-span-3 lg:mt-0">
                      <h4 className="break-words text-sm font-bold text-on-surface">
                        {getBountyTitle(bounty)}
                      </h4>
                      <p className="mt-1 break-words text-xs text-secondary">
                        {getBountyClient(bounty)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 lg:col-span-2 lg:mt-0">
                      <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-secondary">
                        <Package2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{primaryItem}</span>
                      </div>
                    </div>

                    <div className="mt-4 lg:col-span-2 lg:mt-0">
                      <span
                        className={
                          statusLabel === "Urgent"
                            ? "text-sm font-semibold text-tertiary"
                            : "text-sm font-semibold text-on-surface"
                        }
                      >
                        {getRemainingLabel(deadline, resolveStatus(bounty))}
                      </span>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant lg:hidden">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateLabel(deadline)}
                      </div>
                    </div>

                    <div className="mt-4 lg:col-span-2 lg:mt-0">
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(
                          statusLabel
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            statusLabel
                          )}`}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-end lg:col-span-1 lg:mt-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:bg-primary group-hover:text-white">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </section>

          <section className="relative mt-12 overflow-hidden rounded-[2rem] bg-on-surface p-8 text-surface shadow-sm">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
            <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Curator&apos;s Choice
                </div>

                <h3 className="font-headline text-3xl font-bold">
                  Premium Seasonal Harvest
                </h3>

                <p className="mt-4 max-w-xl text-base leading-8 text-surface/70 md:text-lg">
                  Prioritaskan bounty dengan deadline dekat dan item bernilai tinggi.
                  Pastikan data supplier serta kesiapan panen selalu terupdate.
                </p>

                <button
                  type="button"
                  onClick={() => setStatusFilter("urgent")}
                  className="mt-6 rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container transition hover:scale-[1.02]"
                >
                  View Priority Bounties
                </button>
              </div>

              <div className="relative h-56 overflow-hidden rounded-2xl bg-primary/15">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(74,225,118,0.55),transparent_34%),radial-gradient(circle_at_70%_68%,rgba(34,197,94,0.45),transparent_38%)]" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
                      <Clock3 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {stats.urgent} urgent bounties
                      </p>
                      <p className="mt-1 text-xs text-white/70">
                        Closing soon from available requests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-12 flex flex-col gap-4 border-t border-outline-variant/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-secondary">
              Showing {showingStart}-{showingEnd} of {filteredBounties.length} Bounties
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
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
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 3 ? (
                <span className="flex h-10 items-center px-2 text-sm font-bold text-secondary">
                  ...
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
        {value}
      </p>
    </div>
  );
}