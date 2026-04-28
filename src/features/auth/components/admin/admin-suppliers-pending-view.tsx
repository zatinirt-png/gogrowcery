"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  HelpCircle,
  LandPlot,
  Loader2,
  MapPinned,
  PencilLine,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  StickyNote,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveSupplier,
  getPendingSuppliers,
  rejectSupplier,
} from "@/features/auth/api";
import type { PendingSupplierRecord } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import AdminShell from "./admin-shell";

type WorkingState = {
  id: string | number | null;
  action: "approve" | "reject" | null;
};

type SupplierLandRecord = {
  nama_lahan?: string;
  nama_pemilik?: string;
  no_hp?: string;
  alamat_lahan?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kepemilikan?: string;
  luas_lahan_m2?: number | string;
  status_aktif?: string;
};

type SupplierPayoutRecord = {
  payout_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  ewallet_name?: string;
  ewallet_account_number?: string;
  ewallet_account_name?: string;
};

const NOTES_STORAGE_KEY = "gg_admin_supplier_review_notes_v1";

function getByPath(source: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function pickString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function pickArray<T>(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function pickObject<T extends Record<string, unknown>>(
  source: unknown,
  paths: string[]
) {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as T;
    }
  }
  return null;
}

function formatDate(value?: string | null) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDateOnly(value?: string | null) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function maskValue(value?: string | null) {
  if (!value || value === "-") return "-";
  if (value.length <= 4) return value;
  return `**** ${value.slice(-4)}`;
}

function getId(item: PendingSupplierRecord) {
  return pickString(item, ["id"], String(item.id ?? ""));
}

function getDisplayName(item: PendingSupplierRecord) {
  return pickString(item, [
    "nama_lengkap",
    "full_name",
    "name",
    "supplier_name",
    "user.name",
    "supplier.name",
    "supplier.user.name",
    "profile.nama_lengkap",
    "data.nama_lengkap",
    "data.name",
    "username",
    "user.username",
  ]);
}

function getUsername(item: PendingSupplierRecord) {
  return pickString(item, [
    "user.username",
    "username",
    "supplier.username",
    "supplier.user.username",
    "data.username",
  ]);
}

function getEmail(item: PendingSupplierRecord) {
  return pickString(item, [
    "email",
    "user.email",
    "supplier.email",
    "supplier.user.email",
    "data.email",
  ]);
}

function getPhone(item: PendingSupplierRecord) {
  return pickString(item, [
    "no_hp",
    "phone",
    "phone_number",
    "user.phone",
    "user.no_hp",
    "supplier.no_hp",
    "profile.no_hp",
    "data.no_hp",
  ]);
}

function getStatus(item: PendingSupplierRecord) {
  return pickString(
    item,
    [
      "approval_status",
      "status",
      "application_status",
      "review_status",
      "data.approval_status",
      "data.status",
    ],
    "pending"
  );
}

function getCreatedAt(item: PendingSupplierRecord) {
  return pickString(
    item,
    [
      "created_at",
      "submitted_at",
      "applied_at",
      "createdAt",
      "data.created_at",
      "data.submitted_at",
      "user.created_at",
    ],
    "-"
  );
}

function getUpdatedAt(item: PendingSupplierRecord) {
  return pickString(
    item,
    [
      "updated_at",
      "updatedAt",
      "reviewed_at",
      "data.updated_at",
      "data.reviewed_at",
      "created_at",
    ],
    "-"
  );
}

function getRole(item: PendingSupplierRecord) {
  return pickString(
    item,
    ["user.role", "role", "supplier.role", "supplier.user.role", "data.role"],
    "supplier"
  );
}

function getKtp(item: PendingSupplierRecord) {
  return pickString(item, [
    "no_ktp",
    "nik",
    "ktp_number",
    "profile.no_ktp",
    "data.no_ktp",
  ]);
}

function getBirthPlace(item: PendingSupplierRecord) {
  return pickString(item, [
    "tempat_lahir",
    "birth_place",
    "profile.tempat_lahir",
    "data.tempat_lahir",
  ]);
}

function getBirthDate(item: PendingSupplierRecord) {
  return pickString(item, [
    "tanggal_lahir",
    "birth_date",
    "date_of_birth",
    "profile.tanggal_lahir",
    "data.tanggal_lahir",
  ]);
}

function getGender(item: PendingSupplierRecord) {
  const value = pickString(item, [
    "jenis_kelamin",
    "gender",
    "profile.jenis_kelamin",
    "data.jenis_kelamin",
  ]);
  if (value === "laki_laki") return "Laki-laki";
  if (value === "perempuan") return "Perempuan";
  return value;
}

function getAddress(item: PendingSupplierRecord) {
  return pickString(item, [
    "alamat_domisili",
    "address",
    "domicile_address",
    "profile.alamat_domisili",
    "data.alamat_domisili",
  ]);
}

function getLocation(item: PendingSupplierRecord) {
  const desa = pickString(item, ["desa", "village", "profile.desa", "data.desa"], "");
  const kecamatan = pickString(
    item,
    ["kecamatan", "district", "profile.kecamatan", "data.kecamatan"],
    ""
  );
  const kabupaten = pickString(
    item,
    ["kabupaten", "city", "regency", "profile.kabupaten", "data.kabupaten"],
    ""
  );

  const parts = [desa, kecamatan, kabupaten].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function getLands(item: PendingSupplierRecord): SupplierLandRecord[] {
  const direct = pickArray<SupplierLandRecord>(item, [
    "lands",
    "land_records",
    "supplier_lands",
    "data.lands",
    "data.land_records",
    "profile.lands",
    "supplier.lands",
  ]);

  if (direct.length) return direct;

  const single = pickObject<Record<string, unknown>>(item, [
    "land",
    "data.land",
    "profile.land",
  ]);

  return single ? [single as SupplierLandRecord] : [];
}

function getPayout(item: PendingSupplierRecord): SupplierPayoutRecord | null {
  const direct = pickObject<Record<string, unknown>>(item, [
    "payout_account",
    "payout",
    "payout_info",
    "settlement",
    "settlement_config",
    "data.payout_account",
    "data.payout",
    "data.payout_info",
    "profile.payout_account",
    "profile.payout",
    "supplier.payout_account",
    "supplier.payout",
  ]);

  if (direct) return direct as SupplierPayoutRecord;

  const payouts = pickArray<Record<string, unknown>>(item, [
    "payouts",
    "data.payouts",
    "supplier.payouts",
  ]);

  return payouts.length ? (payouts[0] as SupplierPayoutRecord) : null;
}

function getApplicationCode(item: PendingSupplierRecord) {
  const rawId = getId(item) || String(item.id ?? "");
  return `APP-${String(rawId).padStart(6, "0")}`;
}

function getStatusPillClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return "bg-primary text-white";
  if (normalized === "rejected") return "bg-red-600 text-white";
  return "bg-surface-container-highest text-on-surface-variant";
}

function getPayoutLabel(payout: SupplierPayoutRecord | null) {
  if (!payout?.payout_method) return "-";
  return payout.payout_method === "ewallet" ? "E-wallet" : "Bank Transfer";
}

function buildSearchText(item: PendingSupplierRecord) {
  return [
    getDisplayName(item),
    getUsername(item),
    getEmail(item),
    getPhone(item),
    getLocation(item),
    getStatus(item),
    getRole(item),
    getKtp(item),
  ]
    .join(" ")
    .toLowerCase();
}

function getTotalLandArea(lands: SupplierLandRecord[]) {
  return lands.reduce((sum, land) => {
    const raw =
      typeof land.luas_lahan_m2 === "number"
        ? land.luas_lahan_m2
        : Number(land.luas_lahan_m2 || 0);

    return sum + (Number.isFinite(raw) ? raw : 0);
  }, 0);
}

export default function AdminSuppliersPendingView() {
  const [items, setItems] = useState<PendingSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<WorkingState>({
    id: null,
    action: null,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
      if (!raw) return;
      setNotesById(JSON.parse(raw));
    } catch {
      setNotesById({});
    }
  }, []);

  const persistNotes = (next: Record<string, string>) => {
    setNotesById(next);
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      //
    }
  };

  const load = async () => {
    setIsLoading(true);

    try {
      const normalized = await getPendingSuppliers();

      const sorted = [...normalized].sort((a, b) => {
        const aTime = new Date(getCreatedAt(a)).getTime();
        const bTime = new Date(getCreatedAt(b)).getTime();

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;
        return bTime - aTime;
      });

      setItems(sorted);
      setLastLoadedAt(new Date().toISOString());

      setSelectedId((current) => {
        if (current && sorted.some((item) => String(item.id) === String(current))) {
          return current;
        }
        return sorted[0]?.id ?? null;
      });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => buildSearchText(item).includes(keyword));
  }, [items, query]);

  useEffect(() => {
    if (!selectedId && filteredItems.length > 0) {
      setSelectedId(filteredItems[0].id);
      return;
    }

    if (
      selectedId &&
      !filteredItems.some((item) => String(item.id) === String(selectedId))
    ) {
      setSelectedId(filteredItems[0]?.id ?? null);
    }
  }, [filteredItems, selectedId]);

  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item) => String(item.id) === String(selectedId)) ?? null
    );
  }, [filteredItems, selectedId]);

  const selectedLands = useMemo(
    () => (selectedItem ? getLands(selectedItem) : []),
    [selectedItem]
  );

  const selectedPayout = useMemo(
    () => (selectedItem ? getPayout(selectedItem) : null),
    [selectedItem]
  );

  const currentNote = selectedItem ? notesById[String(selectedItem.id)] || "" : "";

  const handleNoteChange = (value: string) => {
    if (!selectedItem) return;
    persistNotes({
      ...notesById,
      [String(selectedItem.id)]: value,
    });
  };

  const handleAction = async (
    id: string | number,
    action: "approve" | "reject"
  ) => {
    setWorking({ id, action });

    try {
      if (action === "approve") {
        await approveSupplier(id);
        toast.success("Supplier berhasil di-approve.");
      } else {
        await rejectSupplier(id);
        toast.success("Supplier berhasil di-reject.");
      }

      await load();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setWorking({ id: null, action: null });
    }
  };

  return (
    <AdminShell
      title="Supplier Application Review"
      description="Workspace review supplier dibuat lebih aman untuk mobile dan tablet. Queue tetap mudah dipilih, detail tetap terbaca, dan action approve / reject tetap live."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <Link
            href="/admin/suppliers/add"
            className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat supplier pending...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="text-sm text-on-surface-variant">
            {items.length === 0
              ? "Tidak ada data pending dari endpoint."
              : "Tidak ada hasil yang cocok dengan pencarian."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <aside className="col-span-12 space-y-5 xl:col-span-4">
            <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Approval Queue
                  </p>
                  <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                    Supplier applications
                  </p>
                </div>

                <div className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                  {filteredItems.length} items
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search applications..."
                  className="w-full rounded-full border-none bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1 xl:max-h-[calc(100vh-18rem)]">
                {filteredItems.map((item) => {
                  const active = String(selectedId) === String(item.id);
                  const payout = getPayout(item);
                  const lands = getLands(item);

                  return (
                    <button
                      key={String(item.id)}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={
                        active
                          ? "w-full rounded-2xl border border-primary/15 bg-surface-container-high p-4 text-left shadow-sm transition"
                          : "w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 text-left shadow-sm transition hover:bg-surface-container-low"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                              {getApplicationCode(item)}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getStatusPillClass(
                                getStatus(item)
                              )}`}
                            >
                              {getStatus(item)}
                            </span>
                          </div>

                          <p className="mt-3 truncate font-headline text-lg font-extrabold text-on-surface">
                            {getDisplayName(item)}
                          </p>
                          <p className="mt-1 truncate text-sm text-on-surface-variant">
                            @{getUsername(item)}
                          </p>
                        </div>

                        <Eye className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant" />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                        <div className="rounded-xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Contact
                          </p>
                          <p className="mt-1 font-semibold text-on-surface">
                            {getPhone(item)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Payout
                          </p>
                          <p className="mt-1 font-semibold text-on-surface">
                            {getPayoutLabel(payout)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Lands
                          </p>
                          <p className="mt-1 font-semibold text-on-surface">
                            {lands.length}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-3">
                          <p className="font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            Submitted
                          </p>
                          <p className="mt-1 font-semibold text-on-surface">
                            {formatDateOnly(getCreatedAt(item))}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="col-span-12 min-w-0 xl:col-span-8">
            {!selectedItem ? (
              <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
                <p className="font-headline text-2xl font-extrabold text-on-surface">
                  Select a supplier application
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Pilih aplikasi di kiri untuk melihat detail review.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-4 xl:mb-8 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                        {getApplicationCode(selectedItem)}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-bold text-primary">
                        <BadgeCheck className="h-4 w-4" />
                        <span>{getRole(selectedItem)}</span>
                      </div>
                    </div>

                    <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                      {getDisplayName(selectedItem)}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-on-surface-variant">
                      @{getUsername(selectedItem)}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
                      <MapPinned className="h-4 w-4 shrink-0" />
                      <span className="break-words">{getLocation(selectedItem)}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                    >
                      <Download className="h-4 w-4" />
                      Full Dossier
                    </button>

                    <button
                      type="button"
                      className="signature-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20"
                    >
                      <PencilLine className="h-4 w-4" />
                      Quick Edit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
                  <div className="col-span-12 space-y-6 xl:col-span-8">
                    <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:p-8">
                      <h3 className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        <Users className="h-4 w-4 text-primary" />
                        Entity Ownership
                      </h3>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="min-w-0">
                          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Primary Registrant
                          </label>
                          <p className="mt-1 break-words font-headline text-lg font-bold text-on-surface">
                            {getDisplayName(selectedItem)}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {getEmail(selectedItem)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Username
                          </label>
                          <p className="mt-1 break-all font-headline text-lg font-bold text-on-surface">
                            @{getUsername(selectedItem)}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            Role: {getRole(selectedItem)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Tax ID / NIK
                          </label>
                          <p className="mt-1 break-words font-headline text-lg font-bold text-on-surface">
                            {getKtp(selectedItem)}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            Registered: {formatDateOnly(getCreatedAt(selectedItem))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Phone
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
                            <Phone className="h-4 w-4 shrink-0 text-primary" />
                            {getPhone(selectedItem)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Birth Info
                          </p>
                          <p className="mt-2 text-sm font-semibold text-on-surface">
                            {getBirthPlace(selectedItem)} • {getBirthDate(selectedItem)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Gender
                          </p>
                          <p className="mt-2 text-sm font-semibold text-on-surface">
                            {getGender(selectedItem)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-4 md:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Domicile Address
                          </p>
                          <p className="mt-2 break-words text-sm leading-7 text-on-surface">
                            {getAddress(selectedItem)}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        <LandPlot className="h-4 w-4 text-primary" />
                        Land & Asset Verification
                      </h3>

                      {selectedLands.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant shadow-sm sm:p-6">
                          Belum ada data lahan yang terbaca dari response pending supplier ini.
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
                          {selectedLands.map((land, index) => (
                            <div
                              key={`${land.nama_lahan || "land"}-${index}`}
                              className="min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm"
                            >
                              <div className="relative h-40 overflow-hidden">
                                <div className="signature-gradient absolute inset-0" />
                                <div className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                                  {land.status_aktif || "Verified"}
                                </div>
                              </div>

                              <div className="p-5 sm:p-6">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h4 className="break-words font-headline text-lg font-bold text-on-surface">
                                      {land.nama_lahan || `Lahan #${index + 1}`}
                                    </h4>
                                    <p className="text-xs text-on-surface-variant">
                                      Pemilik: {land.nama_pemilik || "-"}
                                    </p>
                                  </div>

                                  <div className="shrink-0 text-left sm:text-right">
                                    <p className="font-bold text-primary">
                                      {(Number(land.luas_lahan_m2 || 0) || 0).toLocaleString(
                                        "id-ID"
                                      )}{" "}
                                      m²
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                                      {land.kepemilikan || "-"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-md bg-surface-container px-2 py-1 text-xs text-on-surface">
                                    {[land.desa, land.kecamatan, land.kabupaten]
                                      .filter(Boolean)
                                      .join(", ") || "Lokasi belum ada"}
                                  </span>
                                  <span className="rounded-md bg-surface-container px-2 py-1 text-xs text-on-surface">
                                    {land.provinsi || "Provinsi belum ada"}
                                  </span>
                                </div>

                                <div className="mt-4 rounded-xl bg-surface-container p-3 text-xs text-on-surface">
                                  {land.alamat_lahan || "-"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl bg-surface-container p-5 shadow-sm sm:p-6 lg:p-8">
                      <h3 className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        <Banknote className="h-4 w-4 text-primary" />
                        Settlement Configuration
                      </h3>

                      {!selectedPayout ? (
                        <div className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">
                          Belum ada data payout yang terbaca dari response pending supplier ini.
                        </div>
                      ) : selectedPayout.payout_method === "ewallet" ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Payout Method
                              </span>
                              <span className="inline-flex items-center gap-2 text-sm font-bold text-on-surface">
                                <Smartphone className="h-4 w-4 text-primary" />
                                E-wallet
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Provider
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {selectedPayout.ewallet_name || "-"}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Account Number
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {maskValue(selectedPayout.ewallet_account_number)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Account Name
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {selectedPayout.ewallet_account_name || "-"}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Currency
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                IDR (Rp)
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Review Status
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                Ready for review
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Bank Institution
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {selectedPayout.bank_name || "-"}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Account Number
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {maskValue(selectedPayout.bank_account_number)}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Payout Method
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                Bank Transfer
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Account Name
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                {selectedPayout.bank_account_name || "-"}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-3 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Currency
                              </span>
                              <span className="text-sm font-bold text-on-surface">
                                IDR (Rp)
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                Review Status
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                Ready for review
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>

                  <aside className="col-span-12 space-y-6 xl:col-span-4">
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant">
                        <StickyNote className="h-4 w-4 text-primary" />
                        Curation Notes
                      </h4>

                      <textarea
                        value={currentNote}
                        onChange={(event) => handleNoteChange(event.target.value)}
                        placeholder="Add private reviewer notes..."
                        className="mb-4 h-32 w-full rounded-xl border-none bg-surface-container-low p-4 text-sm text-on-surface outline-none transition focus:ring-1 focus:ring-primary"
                      />

                      <div className="flex items-center gap-2 text-[10px] italic text-on-surface-variant">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Notes hanya tersimpan di browser reviewer ini
                      </div>
                    </div>

                    <div className="rounded-2xl border-t-4 border-primary bg-surface-container-highest/50 p-5 sm:p-6 lg:p-8">
                      <h4 className="mb-6 text-sm font-bold text-on-surface">
                        Final Curation Decision
                      </h4>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => handleAction(selectedItem.id, "approve")}
                          disabled={working.id === selectedItem.id}
                          className="signature-gradient flex w-full items-center justify-center gap-3 rounded-xl py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] disabled:opacity-70"
                        >
                          {working.id === selectedItem.id &&
                          working.action === "approve" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve Supplier
                        </button>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest py-3 text-xs font-bold text-on-surface-variant transition hover:bg-white"
                          >
                            Request Revision
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAction(selectedItem.id, "reject")}
                            disabled={working.id === selectedItem.id}
                            className="rounded-xl border border-tertiary/10 bg-surface-container-lowest py-3 text-xs font-bold text-tertiary transition hover:bg-tertiary/5 disabled:opacity-70"
                          >
                            {working.id === selectedItem.id &&
                            working.action === "reject" ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Rejecting...
                              </span>
                            ) : (
                              "Reject Application"
                            )}
                          </button>
                        </div>

                        <div className="mt-4 border-t border-outline-variant/20 pt-4">
                          <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                            Update Survey Status
                          </label>
                          <select className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary">
                            <option>Survey: Completed (High Score)</option>
                            <option>Survey: In Progress</option>
                            <option>Survey: Pending Review</option>
                            <option>Survey: Flagged for Issues</option>
                          </select>
                        </div>

                        <div className="rounded-xl bg-surface-container-low p-4 text-xs text-on-surface-variant">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                            <span>
                              Approve dan Reject sudah live. Request Revision dan
                              Survey Status masih UI-only.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
                      <h4 className="mb-6 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        Review Timeline
                      </h4>

                      <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-surface-container">
                        <div className="relative flex gap-4">
                          <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-on-surface">
                              Application Received
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {formatDate(getCreatedAt(selectedItem))}
                            </p>
                          </div>
                        </div>

                        <div className="relative flex gap-4">
                          <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                            <LandPlot className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-on-surface">
                              Land Assets Parsed
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              Lands: {selectedLands.length} • Area:{" "}
                              {getTotalLandArea(selectedLands).toLocaleString("id-ID")} m²
                            </p>
                          </div>
                        </div>

                        <div className="relative flex gap-4">
                          <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
                            <HelpCircle className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-on-surface">
                              Awaiting Final Decision
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              Last updated: {formatDate(getUpdatedAt(selectedItem))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
                      <div className="grid gap-3">
                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Username
                          </p>
                          <p className="mt-2 break-all text-sm font-semibold text-on-surface">
                            @{getUsername(selectedItem)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Payout Method
                          </p>
                          <p className="mt-2 text-sm font-semibold text-on-surface">
                            {getPayoutLabel(selectedPayout)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-surface-container p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                            Last Refresh
                          </p>
                          <p className="mt-2 text-sm font-semibold text-on-surface">
                            {formatDate(lastLoadedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}