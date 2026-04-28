import type { PendingSupplierRecord } from "./types";

export type SupplierLandRecord = {
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

export type SupplierPayoutRecord = {
  payout_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  ewallet_name?: string;
  ewallet_account_number?: string;
  ewallet_account_name?: string;
};

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

export function pickString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = getByPath(source, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

export function pickArray<T>(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (Array.isArray(value)) return value as T[];
  }

  return [];
}

export function pickObject<T extends Record<string, unknown>>(
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

export function formatDate(value?: string | null) {
  if (!value || value === "-") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value?: string | null) {
  if (!value || value === "-") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

export function maskValue(value?: string | null) {
  if (!value || value === "-") return "-";
  if (value.length <= 4) return value;
  return `**** ${value.slice(-4)}`;
}

export function getSupplierId(item: PendingSupplierRecord) {
  return pickString(item, ["id", "supplier_id", "user.id", "supplier.id", "data.id"], "");
}

export function getDisplayName(item: PendingSupplierRecord) {
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

export function getUsername(item: PendingSupplierRecord) {
  return pickString(item, [
    "user.username",
    "username",
    "supplier.username",
    "supplier.user.username",
    "data.username",
  ]);
}

export function getEmail(item: PendingSupplierRecord) {
  return pickString(item, [
    "email",
    "user.email",
    "supplier.email",
    "supplier.user.email",
    "data.email",
  ]);
}

export function getPhone(item: PendingSupplierRecord) {
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

export function getStatus(item: PendingSupplierRecord) {
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

export function getStatusLabel(status: string) {
  const normalized = status.trim().replaceAll("_", " ").replaceAll("-", " ");
  if (!normalized) return "Pending";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getCreatedAt(item: PendingSupplierRecord) {
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

export function getUpdatedAt(item: PendingSupplierRecord) {
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

export function getRole(item: PendingSupplierRecord) {
  return pickString(
    item,
    ["user.role", "role", "supplier.role", "supplier.user.role", "data.role"],
    "supplier"
  );
}

export function getKtp(item: PendingSupplierRecord) {
  return pickString(item, [
    "no_ktp",
    "nik",
    "ktp_number",
    "profile.no_ktp",
    "data.no_ktp",
  ]);
}

export function getKtpDocumentUrl(item: PendingSupplierRecord) {
  return pickString(
    item,
    [
      "ktp_document_url",
      "ktp_url",
      "ktp_document",
      "documents.ktp",
      "profile.ktp_document_url",
      "data.ktp_document_url",
    ],
    ""
  );
}

export function getBirthPlace(item: PendingSupplierRecord) {
  return pickString(item, [
    "tempat_lahir",
    "birth_place",
    "profile.tempat_lahir",
    "data.tempat_lahir",
  ]);
}

export function getBirthDate(item: PendingSupplierRecord) {
  return pickString(item, [
    "tanggal_lahir",
    "birth_date",
    "date_of_birth",
    "profile.tanggal_lahir",
    "data.tanggal_lahir",
  ]);
}

export function getGender(item: PendingSupplierRecord) {
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

export function getAddress(item: PendingSupplierRecord) {
  return pickString(item, [
    "alamat_domisili",
    "address",
    "domicile_address",
    "profile.alamat_domisili",
    "data.alamat_domisili",
  ]);
}

export function getLocation(item: PendingSupplierRecord) {
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

export function getSource(item: PendingSupplierRecord) {
  return pickString(
    item,
    ["source", "registration_source", "created_by", "data.source"],
    "Public Registration"
  );
}

export function getApplicationCode(item: PendingSupplierRecord) {
  const rawId = getSupplierId(item) || String(item.id ?? "");
  return `APP-${String(rawId).padStart(6, "0")}`;
}

export function getStatusPillClass(status: string) {
  const normalized = status.toLowerCase();

  if (["approved", "active", "accepted", "verified"].includes(normalized)) {
    return "bg-primary text-white";
  }

  if (["rejected", "declined", "denied"].includes(normalized)) {
    return "bg-red-600 text-white";
  }

  if (["pending", "waiting", "in_review", "review"].includes(normalized)) {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-surface-container-high text-on-surface-variant";
}

export function buildSupplierSearchText(item: PendingSupplierRecord) {
  return [
    getApplicationCode(item),
    getDisplayName(item),
    getUsername(item),
    getEmail(item),
    getPhone(item),
    getKtp(item),
    getLocation(item),
    getStatus(item),
    getSource(item),
  ]
    .join(" ")
    .toLowerCase();
}

export function sortSuppliersByNewest(items: PendingSupplierRecord[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(getCreatedAt(a)).getTime();
    const bTime = new Date(getCreatedAt(b)).getTime();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;

    return bTime - aTime;
  });
}