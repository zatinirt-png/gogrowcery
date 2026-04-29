"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  HandCoins,
  Loader2,
  Package2,
  RefreshCw,
  Search,
  UserRound,
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function resolveStatus(record: SupplierBountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Available")
  );
}

function getStatusClass(status: string) {
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
  return firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.id"],
    `BNT-${String(index + 1).padStart(3, "0")}`
  );
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
  if (diffHours < 24) return `${diffHours} jam lagi`;

  return `${Math.ceil(diffHours / 24)} hari lagi`;
}

function isOpenBounty(record: SupplierBountyRecord) {
  const status = resolveStatus(record).toLowerCase();
  return ["published", "available", "open", "active"].includes(status);
}

function isUrgentBounty(record: SupplierBountyRecord) {
  if (!isOpenBounty(record)) return false;

  const deadline = getDeadlineDate(getDeadline(record));
  if (!deadline) return false;

  const diffDays = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 3;
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

  const filteredBounties = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return bounties;

    return bounties.filter((bounty, index) => {
      const haystack = [
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

      return haystack.includes(keyword);
    });
  }, [bounties, search]);

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
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={loadBounties}
        disabled={isLoadingBounties}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
      >
        {isLoadingBounties ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh Bounties
      </button>
    </div>
  );

  return (
    <SupplierShell
      title="Bounty Directory"
      description="Lihat daftar bounty yang tersedia. Klik salah satu bounty untuk membuka halaman detail."
      actions={headerActions}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounties ? null : (
        <div className="grid gap-5 sm:gap-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <article className="min-w-0 overflow-hidden rounded-3xl bg-surface-container-lowest p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Supplier
              </p>
              <div className="mt-3 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-lg font-bold text-on-surface sm:text-xl">
                    {user?.name ?? "-"}
                  </p>
                  <p className="break-words text-sm text-on-surface-variant">
                    {user?.role ?? "supplier"}
                  </p>
                </div>
              </div>
            </article>

            <article className="min-w-0 overflow-hidden rounded-3xl bg-surface-container-lowest p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Total Bounty
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-3xl font-extrabold leading-none text-on-surface">
                    {stats.total}
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Semua bounty dari API supplier.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                  <HandCoins className="h-5 w-5" />
                </div>
              </div>
            </article>

            <article className="min-w-0 overflow-hidden rounded-3xl bg-surface-container-lowest p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Available
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-3xl font-extrabold leading-none text-on-surface">
                    {stats.open}
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Bounty aktif yang bisa dilihat supplier.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
            </article>

            <article className="min-w-0 overflow-hidden rounded-3xl bg-surface-container-lowest p-4 shadow-sm sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Requested Items
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-3xl font-extrabold leading-none text-on-surface">
                    {stats.totalItems}
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Total item permintaan.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                  <Package2 className="h-5 w-5" />
                </div>
              </div>
            </article>
          </section>

          {bountyError ? (
            <section className="rounded-3xl bg-error-container p-5 shadow-sm">
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

          <section className="rounded-3xl bg-surface-container-low p-4 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Search Bounty
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari title, client, item, status..."
                    className="w-full rounded-2xl border border-transparent bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface">
                {filteredBounties.length} / {bounties.length} bounty
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-headline text-xl font-extrabold text-on-surface">
                  Bounty List
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Klik card bounty untuk membuka detail.
                </p>
              </div>

              {stats.urgent > 0 ? (
                <span className="inline-flex w-fit rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold text-on-tertiary-fixed-variant">
                  {stats.urgent} urgent deadline
                </span>
              ) : null}
            </div>

            {filteredBounties.length === 0 ? (
              <div className="rounded-3xl bg-surface-container-low p-6 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-on-surface-variant" />
                <p className="mt-3 font-bold text-on-surface">Bounty belum tersedia</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Tidak ada bounty yang cocok dengan pencarian saat ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredBounties.map((bounty, index) => {
                  const id = getBountyId(bounty, index);
                  const status = resolveStatus(bounty);
                  const deadline = getDeadline(bounty);
                  const items = getBountyItems(bounty);

                  return (
                    <Link
                      key={`${id}-${index}`}
                      href={`/supplier/bounties/${encodeURIComponent(id)}`}
                      className="group block min-w-0 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-container-low hover:shadow-md sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                              {getBountyCode(bounty, index)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>

                          <p className="mt-3 break-words font-headline text-lg font-extrabold text-on-surface sm:text-xl">
                            {getBountyTitle(bounty)}
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold text-primary">
                            {getBountyClient(bounty)}
                          </p>

                          <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-on-surface-variant">
                            {getBountyDescription(bounty)}
                          </p>
                        </div>

                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-on-surface-variant transition group-hover:translate-x-1 group-hover:text-primary" />
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                        <div className="rounded-2xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Deadline
                          </p>
                          <p className="mt-1 break-words font-semibold text-on-surface">
                            {formatDateLabel(deadline)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Remaining
                          </p>
                          <p className="mt-1 break-words font-semibold text-on-surface">
                            {getRemainingLabel(deadline, status)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Items
                          </p>
                          <p className="mt-1 font-semibold text-on-surface">
                            {items.length}
                          </p>
                        </div>
                      </div>

                      {items.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {items.slice(0, 4).map((item, itemIndex) => (
                            <span
                              key={String(
                                item.id ?? `${getItemName(item, itemIndex)}-${itemIndex}`
                              )}
                              className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                            >
                              <span className="truncate">
                                {getItemName(item, itemIndex)} • {getItemQty(item)}
                              </span>
                            </span>
                          ))}

                          {items.length > 4 ? (
                            <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
                              +{items.length - 4} lainnya
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </SupplierShell>
  );
}