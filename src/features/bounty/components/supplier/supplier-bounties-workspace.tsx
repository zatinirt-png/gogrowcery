"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Loader2,
  Package2,
  RefreshCw,
  Search,
  Sprout,
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

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const parts = path.split(".");
    let current: unknown = source;

    for (const part of parts) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }

  return fallback;
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
  return firstString(record, ["status", "approval_status"], "Available");
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "published" ||
    normalized === "available" ||
    normalized === "open"
  ) {
    return "bg-primary/10 text-primary";
  }

  if (normalized === "draft") {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (normalized === "closed") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  if (normalized === "cancelled") {
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
      : "-";
  const unit =
    typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : "";
  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

function getBountyCode(record: SupplierBountyRecord, index: number) {
  return firstString(record, ["code"], `BNT-${String(index + 1).padStart(3, "0")}`);
}

function getBountyItems(record: SupplierBountyRecord) {
  return Array.isArray(record.items) ? record.items : [];
}

function getBountyTitle(record: SupplierBountyRecord) {
  return firstString(record, ["title"], "Untitled Bounty");
}

function getBountyClient(record: SupplierBountyRecord) {
  return firstString(record, ["client_name", "client.name"], "Client tidak tersedia");
}

function getBountyDescription(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["description", "notes"],
    "Tidak ada deskripsi bounty."
  );
}

function getDeadline(record: SupplierBountyRecord) {
  return firstString(record, ["deadline_at", "deadline"], "-");
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadUser = async () => {
    try {
      const meResponse = await getMe();
      setUser(meResponse.user);
    } catch (error) {
      clearAuthSession();
      toast.error(getAuthErrorMessage(error));
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadBounties = async () => {
    setIsLoadingBounties(true);

    try {
      const bountyResponse = await getSupplierBounties();
      setBounties(bountyResponse);
      setBountyError(null);
      setSelectedIndex(0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal memuat bounty supplier.";

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
        setSelectedIndex(0);
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "Gagal memuat bounty supplier.";

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

    return bounties.filter((bounty) => {
      const haystack = [
        getBountyTitle(bounty),
        getBountyClient(bounty),
        getBountyDescription(bounty),
        resolveStatus(bounty),
        getBountyCode(bounty, 0),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [bounties, search]);

  useEffect(() => {
    if (filteredBounties.length === 0) {
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex > filteredBounties.length - 1) {
      setSelectedIndex(0);
    }
  }, [filteredBounties, selectedIndex]);

  const selectedBounty = filteredBounties[selectedIndex] ?? null;

  const stats = useMemo(() => {
    const total = bounties.length;
    const open = bounties.filter((item) => {
      const status = resolveStatus(item).toLowerCase();
      return status === "published" || status === "available" || status === "open";
    }).length;

    const totalItems = bounties.reduce((acc, bounty) => {
      return acc + getBountyItems(bounty).length;
    }, 0);

    return { total, open, totalItems };
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
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={loadBounties}
        disabled={isLoadingBounties}
        className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-70"
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
      title="Dashboard Supplier"
      description="Lihat daftar bounty yang tersedia, pantau kebutuhan permintaan, dan cek detail peluang yang bisa Anda tindak lanjuti."
      actions={headerActions}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounties ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat dashboard supplier...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Supplier
              </p>
              <p className="mt-3 text-xl font-bold text-on-surface">
                {user?.name ?? "-"}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {user?.email ?? "Tanpa email"}
              </p>
            </article>

            <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Total Bounties
              </p>
              <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                {stats.total}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Semua bounty yang berhasil dibaca dari API supplier.
              </p>
            </article>

            <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Open / Available
              </p>
              <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                {stats.open}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Bounty dengan status open, available, atau published.
              </p>
            </article>

            <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Total Requested Items
              </p>
              <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                {stats.totalItems}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Jumlah total item permintaan dari semua bounty.
              </p>
            </article>
          </section>

          {bountyError ? (
            <section className="rounded-xl bg-error-container p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-on-error-container" />
                <div>
                  <p className="font-bold text-on-error-container">
                    Endpoint supplier bounty gagal dibaca
                  </p>
                  <p className="mt-1 text-sm text-on-error-container">
                    {bountyError}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="relative z-0 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Search Bounties
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari title, client, description, atau status..."
                className="w-full rounded-xl border border-transparent bg-surface-container-low py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              />
            </div>
          </section>

          <section className="relative z-0 grid grid-cols-12 gap-6 items-start">
            <aside className="col-span-12 xl:col-span-4">
              <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Bounty List
                    </p>
                    <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                      Available records
                    </p>
                  </div>

                  <div className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    {filteredBounties.length} items
                  </div>
                </div>

                {filteredBounties.length === 0 ? (
                  <div className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                    Tidak ada bounty yang cocok dengan pencarian.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                    {filteredBounties.map((bounty, index) => {
                      const status = resolveStatus(bounty);
                      const active = index === selectedIndex;

                      return (
                        <button
                          key={String(bounty.id ?? `${getBountyTitle(bounty)}-${index}`)}
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className={
                            active
                              ? "w-full rounded-xl border border-primary/15 bg-surface-container-high p-4 text-left shadow-sm transition-all"
                              : "w-full rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 text-left shadow-sm transition-all hover:bg-surface-container-low"
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
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

                              <p className="mt-3 truncate font-headline text-lg font-extrabold text-on-surface">
                                {getBountyTitle(bounty)}
                              </p>
                              <p className="mt-1 text-sm text-on-surface-variant">
                                {getBountyClient(bounty)}
                              </p>
                            </div>

                            <ClipboardList className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant" />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg bg-surface-container p-3">
                              <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                                Deadline
                              </p>
                              <p className="mt-1 font-semibold text-on-surface">
                                {formatDateLabel(getDeadline(bounty))}
                              </p>
                            </div>

                            <div className="rounded-lg bg-surface-container p-3">
                              <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                                Items
                              </p>
                              <p className="mt-1 font-semibold text-on-surface">
                                {getBountyItems(bounty).length}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <div className="col-span-12 xl:col-span-8">
              {!selectedBounty ? (
                <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
                  <p className="font-headline text-2xl font-extrabold text-on-surface">
                    Select a bounty
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Pilih bounty di kiri untuk melihat detail lengkap.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              resolveStatus(selectedBounty)
                            )}`}
                          >
                            {resolveStatus(selectedBounty)}
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDateLabel(getDeadline(selectedBounty))}
                          </span>
                        </div>

                        <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                          {getBountyTitle(selectedBounty)}
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-primary">
                          {getBountyClient(selectedBounty)}
                        </p>

                        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                          {getBountyDescription(selectedBounty)}
                        </p>
                      </div>

                      <div className="min-w-[240px] rounded-xl bg-surface-container-low p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                          Summary
                        </p>

                        <div className="mt-4 grid gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                              Bounty Code
                            </p>
                            <p className="mt-1 text-lg font-bold text-on-surface">
                              {getBountyCode(selectedBounty, selectedIndex)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                              Requested Items
                            </p>
                            <p className="mt-1 text-lg font-bold text-on-surface">
                              {getBountyItems(selectedBounty).length}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                              Deadline
                            </p>
                            <p className="mt-1 text-sm font-medium text-on-surface">
                              {formatDateLabel(getDeadline(selectedBounty))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold text-on-surface">
                        Requested Items
                      </p>
                    </div>

                    {getBountyItems(selectedBounty).length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {getBountyItems(selectedBounty).map((item, itemIndex) => (
                          <div
                            key={String(item.id ?? `${getItemName(item, itemIndex)}-${itemIndex}`)}
                            className="rounded-xl bg-surface-container-low p-4"
                          >
                            <p className="text-sm font-bold text-on-surface">
                              {getItemName(item, itemIndex)}
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">
                              {getItemQty(item)}
                            </p>
                            <p className="mt-2 text-xs text-on-surface-variant">
                              {typeof item.notes === "string" && item.notes.trim()
                                ? item.notes.trim()
                                : "Tanpa catatan tambahan"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">
                        Response bounty ini belum menyertakan daftar item.
                      </p>
                    )}
                  </section>

                  <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                        Viewer
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">
                            {user?.name ?? "-"}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {user?.role ?? "supplier"}
                          </p>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                        Current Limitation
                      </p>
                      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                        Dashboard ini sudah live untuk membaca bounty, tetapi belum
                        bisa apply atau take bounty karena endpoint-nya belum ada.
                      </p>
                    </article>

                    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                        Data Source
                      </p>
                      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                        Semua data list diambil dari endpoint supplier bounty yang
                        aktif di backend.
                      </p>
                    </article>
                  </section>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </SupplierShell>
  );
}