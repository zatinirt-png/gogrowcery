"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  Info,
  Leaf,
  Loader2,
  LockKeyhole,
  MapPin,
  Package2,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  Verified,
} from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import { getSupplierBountyDetail } from "@/features/bounty/api";
import type {
  SupplierBountyItem,
  SupplierBountyRecord,
} from "@/features/bounty/types";
import SupplierShell from "./supplier-shell";

type SupplierBountyDetailViewProps = {
  bountyId: string;
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

function resolveStatus(record: SupplierBountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Available")
  );
}

function getBountyId(record: SupplierBountyRecord, fallback: string) {
  return firstString(record, ["id", "uuid", "bounty_id", "data.id"], fallback);
}

function getBountyCode(record: SupplierBountyRecord, fallback: string) {
  const rawCode = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.id"],
    fallback
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
    "GoGrowcery National"
  );
}

function getBountyDescription(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["description", "notes", "data.description"],
    "Bounty ini berisi permintaan pasokan bahan pangan dari buyer terverifikasi. Supplier dapat melakukan inspeksi detail kebutuhan item, deadline, dan catatan kualitas sebelum masuk ke fase penawaran atau fulfillment."
  );
}

function getDeadline(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["deadline_at", "deadline", "deadlineAt", "data.deadline_at"],
    "-"
  );
}

function getCreatedAt(record: SupplierBountyRecord) {
  return firstString(record, ["created_at", "createdAt", "data.created_at"], "-");
}

function getUpdatedAt(record: SupplierBountyRecord) {
  return firstString(record, ["updated_at", "updatedAt", "data.updated_at"], "-");
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

  return quantity;
}

function getItemUnit(item: SupplierBountyItem) {
  return firstString(item, ["unit"], "-").toUpperCase();
}

function getItemNotes(item: SupplierBountyItem) {
  return firstString(
    item,
    ["notes", "description", "quality_notes"],
    "Tidak ada catatan kualitas tambahan."
  );
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

function getDeadlineDate(value: string) {
  if (!value || value === "-") return null;

  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRemainingLabel(value: string, status: string) {
  const normalizedStatus = status.toLowerCase();

  if (!["published", "available", "open", "active", "verified"].includes(normalizedStatus)) {
    return normalizedStatus === "draft" ? "Belum dipublish" : "Tidak aktif";
  }

  const deadline = getDeadlineDate(value);
  if (!deadline) return "Deadline tidak valid";

  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Deadline lewat";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `Closing in ${Math.max(diffHours, 1)}h`;

  return `${Math.ceil(diffHours / 24)} hari tersisa`;
}

function getStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (["published", "available", "open", "active"].includes(normalized)) {
    return "bg-primary-container/20 text-primary";
  }

  if (normalized === "verified") {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-surface-container-high text-on-surface";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container";
  }

  return "bg-surface-container-high text-on-surface";
}

function getProcurementTier(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["tier", "procurement_tier", "grade", "data.tier"],
    "Gold / Grade A"
  );
}

function getTargetHub(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["target_hub", "hub", "location", "delivery_location", "data.target_hub"],
    "Regional Fulfillment Hub"
  );
}

function getRepresentativeName(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["representative.name", "client_representative.name", "pic_name", "admin.name"],
    "Procurement Representative"
  );
}

function getRepresentativeRole(record: SupplierBountyRecord) {
  return firstString(
    record,
    ["representative.role", "client_representative.role", "pic_role"],
    `Lead Procurement, ${getBountyClient(record)}`
  );
}

export default function SupplierBountyDetailView({
  bountyId,
}: SupplierBountyDetailViewProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bounty, setBounty] = useState<SupplierBountyRecord | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingBounty, setIsLoadingBounty] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoadingBounty(true);
    else setIsRefreshing(true);

    try {
      const response = await getSupplierBountyDetail(bountyId);
      setBounty(response);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bounty supplier.";
      setBounty(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (mode === "initial") setIsLoadingBounty(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function bootUser() {
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
    }

    bootUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    loadDetail("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bountyId]);

  const normalized = useMemo(() => {
    if (!bounty) return null;

    const status = resolveStatus(bounty);
    const deadline = getDeadline(bounty);
    const items = getBountyItems(bounty);

    return {
      id: getBountyId(bounty, bountyId),
      code: getBountyCode(bounty, `BTY-${bountyId}`),
      title: getBountyTitle(bounty),
      client: getBountyClient(bounty),
      description: getBountyDescription(bounty),
      status,
      deadline,
      items,
      remaining: getRemainingLabel(deadline, status),
      tier: getProcurementTier(bounty),
      targetHub: getTargetHub(bounty),
      createdAt: getCreatedAt(bounty),
      updatedAt: getUpdatedAt(bounty),
      representativeName: getRepresentativeName(bounty),
      representativeRole: getRepresentativeRole(bounty),
    };
  }, [bounty, bountyId]);

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

  return (
    <SupplierShell
      title="The Precision Harvest"
      description="Read-only bounty inspection detail untuk supplier."
      actions={
        <button
          type="button"
          onClick={() => loadDetail("refresh")}
          disabled={isLoadingBounty || isRefreshing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Detail
        </button>
      }
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      user={user}
    >
      {isLoadingUser || isLoadingBounty ? null : errorMessage || !bounty || !normalized ? (
        <section className="rounded-xl bg-error-container p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
            <div className="min-w-0">
              <p className="font-bold text-on-error-container">Detail bounty gagal dibaca</p>
              <p className="mt-1 break-words text-sm text-on-error-container">
                {errorMessage || "Data bounty tidak ditemukan."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="w-full">
          <div className="mb-8 flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <Link href="/supplier/bounties" className="hover:text-primary">
              Bounties
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-on-surface">Bounty Detail</span>
          </div>

          <div className="mb-6">
            <Link
              href="/supplier/bounties"
              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Available Bounties
            </Link>
          </div>

          <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex min-w-0 flex-col justify-between rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8 lg:col-span-2">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-surface-container-highest px-3 py-1 font-headline text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                    {normalized.code}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-headline text-xs font-bold uppercase ${getStatusBadgeClass(
                      normalized.status
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {normalized.status}
                  </span>
                </div>

                <h1 className="break-words font-headline text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">
                  {normalized.title}
                </h1>

                <p className="mt-3 break-words text-lg text-on-surface-variant">
                  Curated for{" "}
                  <span className="font-bold text-on-surface">{normalized.client}</span>
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-8 md:gap-12">
                <HeaderFact
                  icon={CalendarDays}
                  label="Response Deadline"
                  value={formatDateLabel(normalized.deadline)}
                />
                <HeaderFact
                  icon={Verified}
                  label="Procurement Tier"
                  value={normalized.tier}
                />
                <HeaderFact
                  icon={Clock3}
                  label="Remaining"
                  value={normalized.remaining}
                />
              </div>
            </div>

            <div className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-xl bg-primary p-8 text-center text-on-primary shadow-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.18),transparent_36%)] opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-90" />

              <div className="relative z-10">
                <LockKeyhole className="mx-auto mb-4 h-12 w-12" />
                <h3 className="font-headline text-xl font-bold">
                  Bidding Phase Pending
                </h3>
                <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 opacity-90">
                  This bounty is currently in the read-only inspection phase.
                </p>

                <div className="mt-6 inline-block rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-xs font-bold tracking-wide backdrop-blur-md">
                  ACTION RESTRICTED
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div className="space-y-8 xl:col-span-8">
              <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h2 className="mb-6 flex items-center gap-3 font-headline text-xl font-bold text-on-surface">
                  <span className="h-1 w-8 rounded-full bg-primary" />
                  Strategic Overview
                </h2>

                <div className="space-y-4 text-sm leading-8 text-on-surface-variant md:text-base">
                  <p>{normalized.description}</p>
                  <p>
                    Supplier dapat menggunakan halaman ini untuk memeriksa cakupan
                    permintaan, jumlah target, satuan, catatan kualitas, dan batas waktu.
                    Data di halaman ini bersifat inspeksi sebelum tindakan lanjutan
                    tersedia pada fase berikutnya.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoTile
                    icon={Leaf}
                    title="Quality Review Required"
                    body="Pastikan item yang diajukan sesuai dengan catatan kualitas dan kesiapan pasokan."
                  />
                  <InfoTile
                    icon={Truck}
                    title="Logistics Note"
                    body="Supplier perlu memastikan kesiapan pengiriman menuju hub atau titik distribusi yang ditentukan."
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
                <div className="p-6 pb-4 md:p-8 md:pb-4">
                  <h2 className="flex items-center gap-3 font-headline text-xl font-bold text-on-surface">
                    <span className="h-1 w-8 rounded-full bg-primary" />
                    Item Requirements
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Item Name
                        </th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Target Qty
                        </th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Unit
                        </th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Quality Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-outline-variant/5">
                      {normalized.items.length ? (
                        normalized.items.map((item, index) => (
                          <tr
                            key={String(item.id ?? `${normalized.id}-${index}`)}
                            className="group transition-colors hover:bg-surface-container-low"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/15 bg-surface">
                                  <Package2 className="h-5 w-5 text-primary" />
                                </div>

                                <div className="min-w-0">
                                  <p className="break-words font-headline font-bold text-on-surface">
                                    {getItemName(item, index)}
                                  </p>
                                  <p className="text-xs text-on-surface-variant">
                                    Item ID: {String(item.id ?? `REQ-${index + 1}`)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-8 py-5 font-headline font-bold text-on-surface">
                              {getItemQty(item)}
                            </td>

                            <td className="px-8 py-5">
                              <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium">
                                {getItemUnit(item)}
                              </span>
                            </td>

                            <td className="px-8 py-5 text-sm leading-6 text-on-surface-variant">
                              {getItemNotes(item)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-8 py-8 text-center text-sm text-on-surface-variant"
                          >
                            Response detail bounty belum menyertakan daftar item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center border-t border-outline-variant/5 bg-surface-container-low p-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    End of Requirements List
                  </span>
                </div>
              </section>
            </div>

            <aside className="space-y-6 xl:col-span-4">
              <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Client Representative
                </h3>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-7 w-7" />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words font-headline font-extrabold text-on-surface">
                      {normalized.representativeName}
                    </p>
                    <p className="mt-1 break-words text-xs font-medium text-on-surface-variant">
                      {normalized.representativeRole}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <MiniLine icon={ShieldCheck} text="Verified Account" />
                  <MiniLine
                    icon={Package2}
                    text={`${normalized.items.length} requested item${
                      normalized.items.length === 1 ? "" : "s"
                    }`}
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
                <div className="relative h-40 bg-surface-container-high">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_30%,rgba(34,197,94,0.42),transparent_28%),radial-gradient(circle_at_72%_58%,rgba(0,110,47,0.32),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.55),rgba(224,227,229,0.5))]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent" />
                </div>

                <div className="relative z-10 -mt-8 p-6">
                  <div className="mb-3 inline-block rounded-full bg-primary-container px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-primary-container">
                    Target Hub
                  </div>

                  <h4 className="break-words font-headline font-extrabold text-on-surface">
                    {normalized.targetHub}
                  </h4>

                  <p className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5" />
                    Supplier delivery coordination point
                  </p>
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-low/50 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/10 py-2">
                  <span className="text-xs font-medium text-on-secondary-container">
                    Visibility
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    Supplier View
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant/10 py-2">
                  <span className="text-xs font-medium text-on-secondary-container">
                    Contract Type
                  </span>
                  <span className="text-xs font-bold text-on-surface">Standard B2B</span>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant/10 py-2">
                  <span className="text-xs font-medium text-on-secondary-container">
                    Created
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    {formatDateLabel(normalized.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant/10 py-2">
                  <span className="text-xs font-medium text-on-secondary-container">
                    Last Updated
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    {formatDateLabel(normalized.updatedAt)}
                  </span>
                </div>

                <div className="pt-6 text-center">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-tertiary">
                    Action Restricted
                  </p>

                  <button
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-surface-container-high py-4 font-headline font-bold text-on-surface-variant opacity-60"
                  >
                    <Info className="h-4 w-4" />
                    Bidding phase not yet active
                  </button>

                  <p className="mt-3 text-[10px] italic text-on-surface-variant">
                    Bidding will be available in the next phase.
                  </p>
                </div>
              </section>
            </aside>
          </section>
        </div>
      )}
    </SupplierShell>
  );
}

function HeaderFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="break-words font-headline font-bold text-on-surface">
          {value}
        </span>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Leaf;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-outline-variant/10 bg-surface p-4">
      <div className="rounded-lg bg-primary/5 p-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-on-surface">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}

function MiniLine({
  icon: Icon,
  text,
}: {
  icon: typeof ShieldCheck;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-on-surface">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}