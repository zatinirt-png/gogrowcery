"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Home,
  IdCard,
  Loader2,
  Mail,
  MapPinned,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sprout,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveSupplier,
  getAdminSupplierDetail,
  getPendingSuppliers,
  rejectSupplier,
} from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import {
  formatDate,
  formatDateOnly,
  getAddress,
  getApplicationCode,
  getBirthDate,
  getBirthPlace,
  getCreatedAt,
  getDisplayName,
  getEmail,
  getGender,
  getKtp,
  getKtpDocumentUrl,
  getLocation,
  getPhone,
  getRole,
  getSource,
  getStatus,
  getStatusLabel,
  getStatusPillClass,
  getSupplierId,
  getUpdatedAt,
  getUsername,
  maskValue,
  pickArray,
  pickObject,
  pickString,
  type SupplierLandRecord,
  type SupplierPayoutRecord,
} from "@/features/auth/supplier-review-utils";
import AdminShell from "./admin-shell";

type AdminSupplierDetailViewProps = {
  supplierId: string;
};

type ActionState = "idle" | "loading" | "approving" | "rejecting";

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function getStatusCategory(status: string) {
  const normalized = normalizeStatus(status);

  if (["approved", "active", "accepted", "verified"].includes(normalized)) {
    return "approved";
  }

  if (["rejected", "declined", "denied"].includes(normalized)) {
    return "rejected";
  }

  return "pending";
}

function isFinalStatus(status: string) {
  const category = getStatusCategory(status);
  return category === "approved" || category === "rejected";
}

function formatActionError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return getAuthErrorMessage(error);
}

function getSafeSupplierId(item: PendingSupplierRecord) {
  return getSupplierId(item) || String(item.id ?? "");
}

function getSupplierLands(item: PendingSupplierRecord) {
  const arrayPaths = [
    "lands",
    "land",
    "farms",
    "farmlands",
    "supplier_lands",
    "supplier.lands",
    "profile.lands",
    "data.lands",
  ];

  const lands = pickArray<SupplierLandRecord>(item, arrayPaths);
  if (lands.length > 0) return lands;

  const singleLand = pickObject<Record<string, unknown>>(item, [
    "land",
    "farm",
    "farmland",
    "supplier_land",
    "supplier.land",
    "profile.land",
    "data.land",
  ]);

  return singleLand ? [singleLand as SupplierLandRecord] : [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikePayoutObject(value: Record<string, unknown>) {
  const keys = Object.keys(value).map((key) => key.toLowerCase());

  const payoutKeys = [
    "payout_method",
    "method",
    "payment_method",
    "bank_name",
    "nama_bank",
    "bank",
    "bank_account_number",
    "nomor_rekening",
    "no_rekening",
    "account_number",
    "bank_account_name",
    "nama_rekening",
    "account_name",
    "ewallet_name",
    "e_wallet_name",
    "ewallet_account_number",
    "e_wallet_account_number",
    "ewallet_account_name",
    "e_wallet_account_name",
  ];

  return payoutKeys.some((key) => keys.includes(key));
}

function findPayoutDeep(
  source: unknown,
  depth = 0,
  visited = new WeakSet<object>()
): Record<string, unknown> | null {
  if (!source || depth > 6) return null;

  if (Array.isArray(source)) {
    for (const item of source) {
      const found = findPayoutDeep(item, depth + 1, visited);
      if (found) return found;
    }

    return null;
  }

  if (!isPlainObject(source)) return null;

  if (visited.has(source)) return null;
  visited.add(source);

  if (looksLikePayoutObject(source)) {
    return source;
  }

  const priorityKeys = [
    "payout",
    "payouts",
    "payment",
    "payments",
    "payment_account",
    "payment_accounts",
    "supplier_payout",
    "supplier_payouts",
    "bank_account",
    "bank_accounts",
    "rekening",
    "ewallet",
    "wallet",
  ];

  for (const key of priorityKeys) {
    if (key in source) {
      const found = findPayoutDeep(source[key], depth + 1, visited);
      if (found) return found;
    }
  }

  for (const value of Object.values(source)) {
    const found = findPayoutDeep(value, depth + 1, visited);
    if (found) return found;
  }

  return null;
}

function getSupplierPayout(item: PendingSupplierRecord) {
  const directPayoutObject = pickObject<Record<string, unknown>>(item, [
    "payout",
    "payouts.0",
    "payment",
    "payments.0",
    "payment_account",
    "payment_accounts.0",
    "supplier_payout",
    "supplier_payouts.0",
    "bank_account",
    "bank_accounts.0",

    "supplier.payout",
    "supplier.payouts.0",
    "supplier.payment",
    "supplier.payments.0",
    "supplier.payment_account",
    "supplier.payment_accounts.0",
    "supplier.supplier_payout",
    "supplier.supplier_payouts.0",

    "profile.payout",
    "profile.payouts.0",
    "profile.payment",
    "profile.payment_account",

    "data.payout",
    "data.payouts.0",
    "data.payment",
    "data.payments.0",
    "data.payment_account",
    "data.payment_accounts.0",
    "data.supplier_payout",
    "data.supplier_payouts.0",

    "user.payout",
    "user.payouts.0",
    "user.payment",
    "user.payment_account",
  ]);

  if (directPayoutObject) {
    const normalized = normalizePayoutRecord(directPayoutObject);
    if (hasPayoutValue(normalized)) return normalized;
  }

  const deepPayoutObject = findPayoutDeep(item);

  if (deepPayoutObject) {
    const normalized = normalizePayoutRecord(deepPayoutObject);
    if (hasPayoutValue(normalized)) return normalized;
  }

  const rootPayout = normalizePayoutRecord(item as Record<string, unknown>);
  if (hasPayoutValue(rootPayout)) return rootPayout;

  return null;
}

function formatPayoutMethod(value?: string) {
  if (!value || value === "-") return "-";

  const normalized = value.toLowerCase();

  if (normalized === "transfer" || normalized === "bank") {
    return "Transfer Bank";
  }

  if (normalized === "ewallet" || normalized === "e_wallet") {
    return "E-Wallet";
  }

  return value;
}

function getLandValue(land: SupplierLandRecord, paths: string[], fallback = "-") {
  return pickString(land, paths, fallback);
}

function getPayoutValue(
  payout: SupplierPayoutRecord | null,
  paths: string[],
  fallback = "-"
) {
  if (!payout) return fallback;
  return pickString(payout, paths, fallback);
}

function DetailSection({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            {icon}
          </div>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {label}
      </div>
      <div className="break-words text-sm font-bold text-on-surface">{value}</div>
      {helper ? (
        <div className="mt-1 break-words text-xs leading-5 text-on-surface-variant">
          {helper}
        </div>
      ) : null}
    </div>
  );
}

function EmptyBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
        <FileText className="h-6 w-6" />
      </div>
      <p className="font-headline text-xl font-extrabold text-on-surface">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

function normalizePayoutRecord(
  source: Record<string, unknown>
): SupplierPayoutRecord {
  return {
    payout_method: pickString(
      source,
      [
        "payout_method",
        "method",
        "payment_method",
        "metode_payout",
        "jenis_payout",
      ],
      ""
    ),
    bank_name: pickString(
      source,
      ["bank_name", "nama_bank", "bank", "bankName"],
      ""
    ),
    bank_account_number: pickString(
      source,
      [
        "bank_account_number",
        "nomor_rekening",
        "no_rekening",
        "account_number",
        "rekening",
      ],
      ""
    ),
    bank_account_name: pickString(
      source,
      [
        "bank_account_name",
        "nama_rekening",
        "account_name",
        "atas_nama",
        "pemilik_rekening",
      ],
      ""
    ),
    ewallet_name: pickString(
      source,
      ["ewallet_name", "e_wallet_name", "nama_ewallet", "wallet_name"],
      ""
    ),
    ewallet_account_number: pickString(
      source,
      [
        "ewallet_account_number",
        "e_wallet_account_number",
        "nomor_ewallet",
        "no_ewallet",
        "wallet_number",
      ],
      ""
    ),
    ewallet_account_name: pickString(
      source,
      [
        "ewallet_account_name",
        "e_wallet_account_name",
        "nama_akun_ewallet",
        "wallet_account_name",
      ],
      ""
    ),
  };
}

function hasPayoutValue(payout: SupplierPayoutRecord | null) {
  if (!payout) return false;

  return Object.values(payout).some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
}

function mergeSupplierRecord(
  listRecord: PendingSupplierRecord | null,
  detailRecord: PendingSupplierRecord | null
): PendingSupplierRecord | null {
  if (!listRecord && !detailRecord) return null;
  if (!listRecord) return detailRecord;
  if (!detailRecord) return listRecord;

  return {
    ...listRecord,
    ...detailRecord,
    user:
      typeof listRecord.user === "object" || typeof detailRecord.user === "object"
        ? {
            ...(typeof listRecord.user === "object" && listRecord.user
              ? (listRecord.user as Record<string, unknown>)
              : {}),
            ...(typeof detailRecord.user === "object" && detailRecord.user
              ? (detailRecord.user as Record<string, unknown>)
              : {}),
          }
        : detailRecord.user ?? listRecord.user,
    supplier:
      typeof listRecord.supplier === "object" ||
      typeof detailRecord.supplier === "object"
        ? {
            ...(typeof listRecord.supplier === "object" && listRecord.supplier
              ? (listRecord.supplier as Record<string, unknown>)
              : {}),
            ...(typeof detailRecord.supplier === "object" && detailRecord.supplier
              ? (detailRecord.supplier as Record<string, unknown>)
              : {}),
          }
        : detailRecord.supplier ?? listRecord.supplier,
    data:
      typeof listRecord.data === "object" || typeof detailRecord.data === "object"
        ? {
            ...(typeof listRecord.data === "object" && listRecord.data
              ? (listRecord.data as Record<string, unknown>)
              : {}),
            ...(typeof detailRecord.data === "object" && detailRecord.data
              ? (detailRecord.data as Record<string, unknown>)
              : {}),
          }
        : detailRecord.data ?? listRecord.data,
  };
}

export default function AdminSupplierDetailView({
  supplierId,
}: AdminSupplierDetailViewProps) {
  const router = useRouter();

  const [supplier, setSupplier] = useState<PendingSupplierRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    "Data supplier belum memenuhi syarat setelah dilakukan review oleh admin."
  );

  const loadSupplier = useCallback(async () => {
  setIsLoading(true);
  setErrorMessage(null);

  try {
    const suppliers = await getPendingSuppliers();

    const listRecord =
      suppliers.find((item) => {
        const ids = [
          getSafeSupplierId(item),
          String(item.id ?? ""),
          pickString(item, ["supplier_id", "user.id", "supplier.id"], ""),
        ].filter(Boolean);

        return ids.includes(supplierId);
      }) ?? null;

    let detailRecord: PendingSupplierRecord | null = null;

    try {
      detailRecord = await getAdminSupplierDetail(supplierId);
    } catch {
      detailRecord = null;
    }

    const mergedRecord = mergeSupplierRecord(listRecord, detailRecord);

    setSupplier(mergedRecord);

    if (mergedRecord) {
      console.log("[SUPPLIER DETAIL RAW]", mergedRecord);
      console.log("[SUPPLIER PAYOUT FOUND]", getSupplierPayout(mergedRecord));
    }

    if (!mergedRecord) {
      setErrorMessage(
        "Supplier tidak ditemukan dari data API. Kemungkinan data sudah berubah status, sudah diproses, atau endpoint detail supplier belum tersedia."
      );
    }
  } catch (error) {
    const message = formatActionError(error);
    setErrorMessage(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
}, [supplierId]);

  useEffect(() => {
    void loadSupplier();
  }, [loadSupplier]);

  const derived = useMemo(() => {
    if (!supplier) return null;

    const status = getStatus(supplier);
    const category = getStatusCategory(status);
    const lands = getSupplierLands(supplier);
    const payout = getSupplierPayout(supplier);
    const ktpDocumentUrl = getKtpDocumentUrl(supplier);

    return {
      status,
      category,
      lands,
      payout,
      ktpDocumentUrl,
      canReview: !isFinalStatus(status),
      supplierApiId: getSafeSupplierId(supplier),
    };
  }, [supplier]);

  const handleApprove = async () => {
    if (!supplier || !derived?.supplierApiId) return;

    const confirmed = window.confirm(
      "Approve supplier ini? Setelah disetujui, supplier dapat masuk ke alur aktif sesuai backend."
    );

    if (!confirmed) return;

    setActionState("approving");

    try {
      await approveSupplier(derived.supplierApiId);
      toast.success("Supplier berhasil di-approve.");
      router.replace("/admin/suppliers/pending");
      router.refresh();
    } catch (error) {
      toast.error(formatActionError(error));
    } finally {
      setActionState("idle");
    }
  };

  const handleReject = async () => {
    if (!supplier || !derived?.supplierApiId) return;

    const cleanReason = rejectReason.trim();

    if (cleanReason.length < 5) {
      toast.error("Alasan reject minimal 5 karakter.");
      return;
    }

    setActionState("rejecting");

    try {
      await rejectSupplier(derived.supplierApiId, cleanReason);
      toast.success("Supplier berhasil di-reject.");
      setShowRejectModal(false);
      router.replace("/admin/suppliers/pending");
      router.refresh();
    } catch (error) {
      toast.error(formatActionError(error));
    } finally {
      setActionState("idle");
    }
  };

  const actions = (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
      <Link
        href="/admin/suppliers/pending"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest sm:w-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      <button
        type="button"
        onClick={() => void loadSupplier()}
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </button>
    </div>
  );

  return (
    <AdminShell
      title="Supplier Overview Detail"
      description="Halaman review detail supplier. Periksa data diri, lokasi, lahan, dan payout sebelum approve atau reject."
      actions={actions}
    >
      {isLoading ? (
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat detail supplier...
          </div>
        </div>
      ) : !supplier || !derived ? (
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Detail supplier tidak ditemukan.</p>
                <p className="mt-1 text-sm">
                  {errorMessage ||
                    "Record tidak ditemukan dari response API pending supplier."}
                </p>
                <Link
                  href="/admin/suppliers/pending"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Pending Applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
              <div className="signature-gradient p-5 text-white sm:p-6 lg:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                        {getApplicationCode(supplier)}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                        {getSource(supplier)}
                      </span>
                    </div>

                    <h1 className="font-headline text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {getDisplayName(supplier)}
                    </h1>

                    <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-white/85 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        @{getUsername(supplier)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {getPhone(supplier)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPinned className="h-4 w-4" />
                        {getLocation(supplier)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/80">
                      Current Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] ${getStatusPillClass(
                        derived.status
                      )}`}
                    >
                      {derived.category === "approved" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : derived.category === "rejected" ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Clock3 className="h-4 w-4" />
                      )}
                      {getStatusLabel(derived.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-4 lg:p-8">
                <InfoCard
                  label="Submitted"
                  value={formatDateOnly(getCreatedAt(supplier))}
                  helper={formatDate(getCreatedAt(supplier))}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
                <InfoCard
                  label="Last Update"
                  value={formatDateOnly(getUpdatedAt(supplier))}
                  helper={formatDate(getUpdatedAt(supplier))}
                  icon={<RefreshCw className="h-4 w-4" />}
                />
                <InfoCard
                  label="Role"
                  value={getRole(supplier)}
                  helper="Hak akses akun setelah aktif"
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
                <InfoCard
                  label="Supplier ID"
                  value={derived.supplierApiId || "-"}
                  helper="ID yang dipakai untuk approve/reject API"
                  icon={<IdCard className="h-4 w-4" />}
                />
              </div>
            </section>

            <DetailSection
              icon={<UserRound className="h-5 w-5" />}
              eyebrow="Section 01"
              title="Identitas Supplier"
              description="Periksa data pribadi dan kontak supplier sebelum mengambil keputusan."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  label="Nama Lengkap"
                  value={getDisplayName(supplier)}
                  icon={<UserRound className="h-4 w-4" />}
                />
                <InfoCard
                  label="Username"
                  value={`@${getUsername(supplier)}`}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />
                <InfoCard
                  label="Email"
                  value={getEmail(supplier)}
                  icon={<Mail className="h-4 w-4" />}
                />
                <InfoCard
                  label="No HP"
                  value={getPhone(supplier)}
                  icon={<Phone className="h-4 w-4" />}
                />
                <InfoCard
                  label="No KTP"
                  value={getKtp(supplier)}
                  helper={`Masked: ${maskValue(getKtp(supplier))}`}
                  icon={<IdCard className="h-4 w-4" />}
                />
                <InfoCard
                  label="Jenis Kelamin"
                  value={getGender(supplier)}
                  icon={<UserRound className="h-4 w-4" />}
                />
                <InfoCard
                  label="Tempat Lahir"
                  value={getBirthPlace(supplier)}
                  icon={<Home className="h-4 w-4" />}
                />
                <InfoCard
                  label="Tanggal Lahir"
                  value={formatDateOnly(getBirthDate(supplier))}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
                <InfoCard
                  label="Dokumen KTP"
                  value={
                    derived.ktpDocumentUrl ? (
                      <a
                        href={derived.ktpDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        Buka dokumen
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      "Tidak tersedia"
                    )
                  }
                  icon={<FileText className="h-4 w-4" />}
                />
              </div>
            </DetailSection>

            <DetailSection
              icon={<MapPinned className="h-5 w-5" />}
              eyebrow="Section 02"
              title="Domisili"
              description="Data alamat digunakan untuk verifikasi area operasional supplier."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  label="Alamat Domisili"
                  value={getAddress(supplier)}
                  icon={<Home className="h-4 w-4" />}
                />
                <InfoCard
                  label="Desa"
                  value={pickString(supplier, ["desa", "profile.desa", "data.desa"])}
                />
                <InfoCard
                  label="Kecamatan"
                  value={pickString(supplier, [
                    "kecamatan",
                    "profile.kecamatan",
                    "data.kecamatan",
                  ])}
                />
                <InfoCard
                  label="Kabupaten"
                  value={pickString(supplier, [
                    "kabupaten",
                    "profile.kabupaten",
                    "data.kabupaten",
                  ])}
                />
                <InfoCard
                  label="Lokasi Ringkas"
                  value={getLocation(supplier)}
                  icon={<MapPinned className="h-4 w-4" />}
                />
              </div>
            </DetailSection>

            <DetailSection
              icon={<Sprout className="h-5 w-5" />}
              eyebrow="Section 03"
              title="Data Lahan"
              description="Review data lahan supplier. Jika supplier punya lebih dari satu lahan, semua akan tampil sebagai kartu terpisah."
            >
              {derived.lands.length === 0 ? (
                <EmptyBlock
                  title="Data lahan belum tersedia"
                  description="API tidak mengembalikan array lands untuk supplier ini."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {derived.lands.map((land, index) => (
                    <div
                      key={`land-${index}-${getLandValue(land, ["nama_lahan"], String(index))}`}
                      className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
                            Lahan #{index + 1}
                          </p>
                          <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">
                            {getLandValue(land, ["nama_lahan", "name"], "Lahan")}
                          </h3>
                        </div>
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                          {getLandValue(land, ["status_aktif", "status"], "aktif")}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoCard
                          label="Pemilik"
                          value={getLandValue(land, ["nama_pemilik", "owner"])}
                        />
                        <InfoCard
                          label="No HP"
                          value={getLandValue(land, ["no_hp", "phone"])}
                        />
                        <InfoCard
                          label="Alamat Lahan"
                          value={getLandValue(land, ["alamat_lahan", "address"])}
                        />
                        <InfoCard
                          label="Desa"
                          value={getLandValue(land, ["desa", "village"])}
                        />
                        <InfoCard
                          label="Kecamatan"
                          value={getLandValue(land, ["kecamatan", "district"])}
                        />
                        <InfoCard
                          label="Kabupaten"
                          value={getLandValue(land, ["kabupaten", "city", "regency"])}
                        />
                        <InfoCard
                          label="Provinsi"
                          value={getLandValue(land, ["provinsi", "province"])}
                        />
                        <InfoCard
                          label="Kepemilikan"
                          value={getLandValue(land, ["kepemilikan", "ownership"])}
                        />
                        <InfoCard
                          label="Luas Lahan"
                          value={`${getLandValue(land, ["luas_lahan_m2", "area"], "0")} m²`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            <DetailSection
              icon={<Banknote className="h-5 w-5" />}
              eyebrow="Section 04"
              title="Payout"
              description="Data rekening atau e-wallet supplier untuk kebutuhan pembayaran."
            >
              {!derived.payout ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold">Data payout belum diterima frontend.</p>
                      <p className="mt-1 text-sm leading-6">
                        Frontend sudah mencari payout dari object <b>payout</b>,{" "}
                        <b>payouts</b>, <b>payment_account</b>,{" "}
                        <b>supplier_payout</b>, <b>bank_account</b>, dan field rekening
                        langsung. Jika masih kosong, berarti endpoint pending/detail supplier
                        belum mengirim data payout.
                      </p>
                      <p className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-xs font-semibold">
                        Solusi backend: pastikan response detail supplier menyertakan relasi
                        payout, misalnya <code>payout</code> atau{" "}
                        <code>supplier_payout</code>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    label="Metode"
                    value={formatPayoutMethod(
                      getPayoutValue(derived.payout, ["payout_method"], "-")
                    )}
                    icon={<CreditCard className="h-4 w-4" />}
                  />
                  <InfoCard
                    label="Bank"
                    value={getPayoutValue(derived.payout, ["bank_name"])}
                    helper="Kosong jika memakai e-wallet"
                  />
                  <InfoCard
                    label="No Rekening"
                    value={getPayoutValue(derived.payout, ["bank_account_number"])}
                    helper={maskValue(
                      getPayoutValue(derived.payout, ["bank_account_number"])
                    )}
                  />
                  <InfoCard
                    label="Nama Rekening"
                    value={getPayoutValue(derived.payout, ["bank_account_name"])}
                  />
                  <InfoCard
                    label="E-Wallet"
                    value={getPayoutValue(derived.payout, ["ewallet_name"])}
                    helper="Kosong jika memakai transfer bank"
                  />
                  <InfoCard
                    label="No E-Wallet"
                    value={getPayoutValue(derived.payout, [
                      "ewallet_account_number",
                    ])}
                    helper={maskValue(
                      getPayoutValue(derived.payout, ["ewallet_account_number"])
                    )}
                  />
                  <InfoCard
                    label="Nama Akun E-Wallet"
                    value={getPayoutValue(derived.payout, ["ewallet_account_name"])}
                  />
                </div>
              )}
            </DetailSection>

            <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Final Decision
                  </p>
                  <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                    Approve atau reject supplier
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                    Tombol keputusan hanya tersedia di halaman detail ini agar
                    proses review lebih aman dan tidak salah klik dari list.
                  </p>
                </div>

                {derived.canReview ? (
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionState !== "idle"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {actionState === "rejecting" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleApprove()}
                      disabled={actionState !== "idle"}
                      className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {actionState === "approving" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-surface-container-low p-4 text-sm font-semibold text-on-surface-variant">
                    Supplier ini sudah berstatus{" "}
                    <span className="font-extrabold text-on-surface">
                      {getStatusLabel(derived.status)}
                    </span>
                    . Action review dikunci.
                  </div>
                )}
              </div>
            </section>
          </div>

          {showRejectModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-5 shadow-2xl sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                      Reject Supplier
                    </p>
                    <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
                      Tolak aplikasi supplier?
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      Isi alasan reject. Sistem akan mencoba mengirim alasan ke
                      backend. Jika backend tidak menerima body, function API yang
                      sudah kita ubah akan fallback ke reject tanpa body.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container"
                  placeholder="Tulis alasan reject..."
                />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    disabled={actionState === "rejecting"}
                    className="inline-flex items-center justify-center rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleReject()}
                    disabled={actionState === "rejecting"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actionState === "rejecting" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Konfirmasi Reject
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </AdminShell>
  );
}