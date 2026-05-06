"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldX,
  CircleDashed,
  FileImage,
  Eye,
  Gavel,
  TrendingUp,
  ArrowRight,
  Building2,
  ReceiptText,
  UserRound,
  Hourglass,
  Info,
  Loader2,
  Package2,
  RefreshCw,
  Send,
  Star,
  StarHalf,
  Trash2,
  Users,
  Plus,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import {
  getAdminBountyBids,
  getAdminBountyDetail,
  updateAdminBountyDraft,
  updateBountyStatus,
  type AdminBountyUpdatePayload,
} from "@/features/bounty/api";
import type {
  AdminBountyRecord,
  BountyItemRecord,
  SupplierBidItemRecord,
  SupplierBidRecord,
} from "@/features/bounty/types";

type AdminBountyDetailViewProps = {
  bountyId: string;
};

type AdminBidderRecord = {
  id?: number | string | null;
  supplier_id?: number | string | null;
  supplierId?: number | string | null;
  user_id?: number | string | null;
  userId?: number | string | null;
  bidder_id?: number | string | null;
  bid_id?: number | string | null;

  name?: string | null;
  full_name?: string | null;
  nama_lengkap?: string | null;
  username?: string | null;
  business_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  no_hp?: string | null;

  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  city?: string | null;
  address?: string | null;
  alamat?: string | null;
  alamat_domisili?: string | null;

  ktp_document?: unknown;
  npwp_document?: unknown;
  ktp_photo?: unknown;
  npwp_photo?: unknown;
  lands?: Array<Record<string, unknown>>;

  [key: string]: unknown;
};

type AdminBidRecord = SupplierBidRecord & {
  supplier_id?: number | string | null;
  supplierId?: number | string | null;
  bidder_id?: number | string | null;
  bidderId?: number | string | null;
  user_id?: number | string | null;
  userId?: number | string | null;

  supplier_name?: string | null;
  bidder_name?: string | null;
  user_name?: string | null;

  supplier?: AdminBidderRecord | null;
  supplier_profile?: AdminBidderRecord | null;
  supplierProfile?: AdminBidderRecord | null;
  bidder?: AdminBidderRecord | null;
  user?: AdminBidderRecord | null;
  profile?: AdminBidderRecord | null;

  
  _bidder?: AdminBidderRecord | null;

  [key: string]: unknown;
};

type BountyDetailModel = {
  id: string;
  code: string;
  title: string;
  clientName: string;
  description: string;
  status: string;
  deadlineAt: string;
  originalDeadlineAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  items: BountyItemRecord[];
  totalBidsFromBounty: number;
};

type BiddingSummary = {
  totalBidders: number;
  targetQty: number;
  proposedQty: number;
  fulfillment: number;
  estimatedValue: number;
};

type ItemProgress = {
  itemId: string;
  itemName: string;
  unit: string;
  targetQty: number;
  proposedQty: number;
  fulfillment: number;
  bidCount: number;
  bestGrade: string;
  averagePrice: number;
};

type EditBountyItemForm = {
  item_name: string;
  target_quantity: string;
  unit: string;
  notes: string;
};

type EditBountyFormState = {
  client_name: string;
  title: string;
  description: string;
  deadline_at: string;
  items: EditBountyItemForm[];
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

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function isDraftStatus(status: string) {
  return normalizeStatus(status) === "draft";
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

function formatDateTime(value?: string | null) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getBountyItems(record: AdminBountyRecord) {
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.bounty_items)) return record.bounty_items;

  const dataItems = getNestedValue(record, "data.items");
  if (Array.isArray(dataItems)) return dataItems as BountyItemRecord[];

  const dataBountyItems = getNestedValue(record, "data.bounty_items");
  if (Array.isArray(dataBountyItems)) return dataBountyItems as BountyItemRecord[];

  return [];
}

function getTotalBidsFromBounty(record: AdminBountyRecord) {
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

function getItemId(item: BountyItemRecord, fallback: string) {
  return firstString(item, ["id", "bounty_item_id", "data.id"], fallback);
}

function getItemName(item: BountyItemRecord, index: number) {
  return firstString(item, ["item_name", "name", "data.item_name"], `Item ${index + 1}`);
}

function getItemQuantityNumber(item: BountyItemRecord) {
  return firstNumber(
    item,
    ["target_quantity", "quantity", "qty", "data.target_quantity"],
    0
  );
}

function getItemQuantityLabel(item: BountyItemRecord) {
  const quantity = firstString(
    item,
    ["target_quantity", "quantity", "qty", "data.target_quantity"],
    "-"
  );

  return `${quantity} ${getItemUnit(item)}`.trim();
}

function getItemUnit(item: BountyItemRecord) {
  return firstString(item, ["unit", "data.unit"], "unit");
}

function getItemNotes(item: BountyItemRecord) {
  return firstString(
    item,
    ["notes", "description", "catatan", "quality_notes", "specifications", "data.notes"],
    ""
  );
}

function getClientInitial(clientName: string) {
  const words = clientName
    .replace(/PT|CV|UD|\./gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "CL";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function toDetailModel(record: AdminBountyRecord, fallbackId: string): BountyDetailModel {
  const id = firstString(record, ["id", "uuid", "bounty_id", "data.id"], fallbackId);

  const rawCode = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "data.code", "id"],
    `BNT-${fallbackId}`
  );

  return {
    id,
    code: rawCode.startsWith("#") ? rawCode.slice(1) : rawCode,
    title: firstString(record, ["title", "name", "data.title"], "Untitled Bounty"),
    clientName: firstString(
      record,
      ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
      "Client tidak tersedia"
    ),
    description: firstString(
      record,
      ["description", "notes", "data.description"],
      "Tidak ada deskripsi bounty."
    ),
    status: titleCase(
      firstString(
        record,
        ["status", "publication_status", "approval_status", "data.status"],
        "Draft"
      )
    ),
    deadlineAt: firstString(
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
    ),
    originalDeadlineAt: firstString(
      record,
      [
        "original_deadline_at",
        "previous_deadline_at",
        "old_deadline_at",
        "initial_deadline_at",
        "data.original_deadline_at",
      ],
      ""
    ),
    createdAt: firstString(record, ["created_at", "createdAt", "data.created_at"], "-"),
    updatedAt: firstString(record, ["updated_at", "updatedAt", "data.updated_at"], "-"),
    createdBy: firstString(
      record,
      ["created_by.name", "creator.name", "admin.name", "user.name", "created_by"],
      "Super Admin"
    ),
    items: getBountyItems(record),
    totalBidsFromBounty: getTotalBidsFromBounty(record),
  };
}

function getStatusMeta(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "draft") {
    return {
      label: "Draft",
      className:
        "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30",
      dotClassName: "bg-secondary",
    };
  }

  if (["published", "active", "available", "open"].includes(normalized)) {
    return {
      label: "Published",
      className: "bg-primary-container text-on-primary-container",
      dotClassName: "bg-primary",
    };
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return {
      label: "Closed",
      className: "bg-orange-100 text-orange-800 border border-orange-200",
      dotClassName: "bg-orange-500",
    };
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return {
      label: "Cancelled",
      className: "bg-error-container text-on-error-container border border-error/10",
      dotClassName: "bg-error",
    };
  }

  return {
    label: status,
    className:
      "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30",
    dotClassName: "bg-secondary",
  };
}

function isDeadlineExtended(detail: BountyDetailModel) {
  if (!detail.originalDeadlineAt || detail.originalDeadlineAt === "-") return false;
  if (!detail.deadlineAt || detail.deadlineAt === "-") return false;

  return formatDate(detail.originalDeadlineAt) !== formatDate(detail.deadlineAt);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstRecord(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    const record = asRecord(value);

    if (record) return record;
  }

  return null;
}

function firstArray(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (Array.isArray(value)) return value;
  }

  return null;
}

function hasDocumentValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return true;

  return false;
}

function firstDocumentValue(source: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (hasDocumentValue(value)) return value;
  }

  return null;
}

const supplierNamePaths = [
  "nama_lengkap",
  "full_name",
  "name",
  "business_name",
  "company_name",
  "username",

  // user nested dari supplier_profile.user
  "user.name",
  "user.username",
  "data.user.name",
  "data.user.username",

  "data.nama_lengkap",
  "data.full_name",
  "data.name",
  "data.username",
];

function getBidderCandidateIds(source: unknown) {
  const paths = [
    "id",
    "supplier_id",
    "supplierId",
    "supplier_profile_id",
    "supplierProfileId",
    "user_id",
    "userId",
    "bidder_id",
    "bidderId",
    "bid_id",
    "bidId",

    "supplier.id",
    "supplier.user_id",
    "supplier_profile.id",
    "supplier_profile.user_id",
    "supplierProfile.id",
    "supplierProfile.user_id",
    "bidder.id",
    "user.id",
    "profile.id",

    "data.id",
    "data.supplier_id",
    "data.supplier_profile_id",
    "data.user_id",
    "data.bidder_id",
    "data.bid_id",
    "data.supplier_profile.id",
    "data.supplier_profile.user_id",

    "pivot.supplier_id",
    "pivot.supplier_profile_id",
    "pivot.user_id",
    "pivot.bidder_id",
    "pivot.bid_id",

    "bid.id",
    "bid.supplier_id",
    "bid.supplier_profile_id",
    "bid.user_id",
    "bid.bidder_id",

    "_bidder.id",
    "_bidder.supplier_id",
    "_bidder.supplier_profile_id",
    "_bidder.user_id",
    "_bidder.bid_id",
    "_bidder.supplier_profile.id",
  ];

  return paths
    .map((path) => firstString(source, [path], ""))
    .filter((value) => value && value !== "-");
}

function getBountyBidderRecords(record: AdminBountyRecord) {
  const arrays = [
    firstArray(record, ["bidders", "data.bidders"]),
    firstArray(record, ["bidder", "data.bidder"]),
    firstArray(record, ["suppliers", "data.suppliers"]),
    firstArray(record, ["submitted_bids", "data.submitted_bids"]),
    firstArray(record, ["bids", "data.bids"]),
  ].filter(Boolean) as unknown[][];

  return arrays.flatMap((items) => {
    return items
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;

        const nested =
          firstRecord(row, [
            "supplier_profile",
            "supplierProfile",
            "supplier",
            "bidder",
            "user",
            "profile",
            "data.supplier_profile",
            "data.supplierProfile",
            "data.supplier",
            "data.bidder",
            "data.user",
            "supplier.user",
          ]) ?? null;

        if (!nested) return row as AdminBidderRecord;

        return {
          ...row,
          ...nested,
          supplier_profile: nested,
          supplier: nested,
          bidder: nested,
        } as AdminBidderRecord;
      })
      .filter(Boolean) as AdminBidderRecord[];
  });
}

function getBidSupplierSource(bid: AdminBidRecord) {
  const candidates = [
    firstRecord(bid, ["_bidder"]),

    // Response API terbaru:
    firstRecord(bid, ["supplier_profile"]),
    firstRecord(bid, ["supplierProfile"]),
    firstRecord(bid, ["data.supplier_profile"]),
    firstRecord(bid, ["data.supplierProfile"]),

    // Fallback lama:
    firstRecord(bid, ["supplier"]),
    firstRecord(bid, ["bidder"]),
    firstRecord(bid, ["user"]),
    firstRecord(bid, ["profile"]),
    firstRecord(bid, ["data.supplier"]),
    firstRecord(bid, ["data.bidder"]),
    firstRecord(bid, ["data.user"]),
    firstRecord(bid, ["data.profile"]),
    firstRecord(bid, ["supplier.user"]),
    firstRecord(bid, ["data.supplier.user"]),
  ].filter(Boolean) as Record<string, unknown>[];

  return (
    candidates.find((candidate) => firstString(candidate, supplierNamePaths, "")) ??
    candidates[0] ??
    null
  );
}

function attachBiddersToBids(
  bids: AdminBidRecord[],
  bidders: AdminBidderRecord[]
) {
  if (!bids.length) return [];

  return bids.map((bid, index) => {
    const bidIds = getBidderCandidateIds(bid);

    const matchedBidder =
      bidders.find((bidder) => {
        const bidderIds = getBidderCandidateIds(bidder);
        return bidderIds.some((id) => bidIds.includes(id));
      }) ??
      bidders[index] ??
      null;

    if (!matchedBidder) return bid;

    return {
      ...bid,
      _bidder: matchedBidder,
      supplier: bid.supplier ?? matchedBidder,
      bidder: bid.bidder ?? matchedBidder,
    } as AdminBidRecord;
  });
}

function createBidRecordsFromBidders(bidders: AdminBidderRecord[]) {
  return bidders.map((bidder, index) => {
    const items =
      firstArray(bidder, [
        "items",
        "bid.items",
        "bid_items",
        "bid.bid_items",
        "data.items",
        "data.bid.items",
      ]) ?? [];

    return {
      id: firstString(
        bidder,
        ["bid.id", "bid_id", "pivot.bid_id", "id"],
        `bid-${index + 1}`
      ),
      supplier_id: firstString(
        bidder,
        ["supplier_id", "user_id", "id", "bid.supplier_id"],
        ""
      ),
      supplier: bidder,
      bidder,
      _bidder: bidder,
      status: firstString(
        bidder,
        ["bid.status", "status", "approval_status"],
        "submitted"
      ),
      submitted_at: firstString(
        bidder,
        ["bid.submitted_at", "bid.created_at", "submitted_at", "created_at"],
        "-"
      ),
      notes: firstString(bidder, ["bid.notes", "notes", "catatan"], ""),
      items: items as SupplierBidItemRecord[],
    } as AdminBidRecord;
  });
}

function getBidItems(bid: AdminBidRecord) {
  const items =
    firstArray(bid, [
      "items",
      "bid_items",
      "data.items",
      "data.bid_items",
      "bid.items",
      "bid.bid_items",
      "_bidder.items",
      "_bidder.bid.items",
      "_bidder.bid_items",
      "_bidder.bid.bid_items",
    ]) ?? [];

  return items as SupplierBidItemRecord[];
}

function getBidSupplierName(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return firstString(
    source,
    supplierNamePaths,
    firstString(
      bid,
      [
        "supplier_name",
        "bidder_name",
        "user_name",
        "name",
        "username",
        "data.supplier_name",
        "data.bidder_name",
        "data.user_name",
      ],
      "Supplier"
    )
  );
}

function getBidId(bid: AdminBidRecord, index: number) {
  return firstString(
    bid,
    [
      "id",
      "bid_id",
      "data.id",
      "data.bid_id",
      "bid.id",
      "_bidder.bid.id",
      "_bidder.bid_id",
      "_bidder.pivot.bid_id",
    ],
    `bid-${index + 1}`
  );
}

function getBidSupplierUsername(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return firstString(
    source,
    [
      "username",
      "user.username",
      "data.username",
      "data.user.username",
      "supplier.username",
    ],
    firstString(bid, ["username", "data.username"], "")
  );
}

function getBidSupplierPhone(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return firstString(
    source,
    [
      "no_hp",
      "phone",
      "phone_number",
      "whatsapp",
      "contact",
      "data.no_hp",
      "data.phone",
      "user.no_hp",
      "user.phone",
    ],
    firstString(
      bid,
      [
        "supplier_phone",
        "phone",
        "no_hp",
        "data.supplier_phone",
        "data.phone",
        "data.no_hp",
      ],
      "-"
    )
  );
}

function getBidSupplierLocation(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  const district = firstString(source, ["kecamatan", "data.kecamatan"], "");
  const city = firstString(
    source,
    ["kabupaten", "city", "address_city", "data.kabupaten", "data.city"],
    ""
  );

  const combined = [district, city].filter(Boolean).join(", ");
  if (combined) return combined;

  return firstString(
    source,
    ["alamat_domisili", "alamat", "address", "desa", "provinsi"],
    firstString(
      bid,
      [
        "supplier.kabupaten",
        "supplier.city",
        "data.supplier.kabupaten",
        "data.supplier.city",
        "kabupaten",
        "city",
      ],
      "-"
    )
  );
}

function getBidSupplierInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "SP";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getBidNotes(bid: AdminBidRecord) {
  return firstString(
    bid,
    [
      "notes",
      "catatan",
      "data.notes",
      "data.catatan",
      "bid.notes",
      "_bidder.bid.notes",
    ],
    ""
  );
}

function getBidApprovalLabel(bid: AdminBidRecord) {
  return titleCase(
    firstString(
      bid,
      [
        "approval_status",
        "status",
        "review_status",
        "data.approval_status",
        "data.status",
        "_bidder.approval_status",
        "_bidder.bid.status",
      ],
      "submitted"
    )
  );
}

function getBidSurveyLabel(bid: AdminBidRecord) {
  return titleCase(
    firstString(
      bid,
      [
        "survey_status",
        "data.survey_status",
        "_bidder.survey_status",
        "_bidder.bid.survey_status",
      ],
      "belum_survey"
    )
  );
}

function getBidLandSource(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return (
    firstRecord(source, [
      "lands.0",
      "lahan.0",
      "farms.0",
      "farm",
      "land",
      "supplier_lands.0",
      "data.lands.0",
      "data.lahan.0",
      "data.farms.0",
    ]) ??
    firstRecord(bid, [
      "land",
      "lands.0",
      "supplier.lands.0",
      "data.supplier.lands.0",
      "_bidder.lands.0",
      "_bidder.data.lands.0",
    ])
  );
}

function getBidLandLocation(bid: AdminBidRecord) {
  const land = getBidLandSource(bid);
  const district = firstString(land, ["kecamatan", "data.kecamatan"], "");
  const city = firstString(land, ["kabupaten", "city", "data.kabupaten"], "");

  const combined = [district, city].filter(Boolean).join(", ");
  if (combined) return combined;

  const landAddress = firstString(
    land,
    ["alamat_lahan", "alamat", "address", "desa", "provinsi"],
    ""
  );

  if (landAddress) return landAddress;

  return getBidSupplierLocation(bid);
}

function getBidLandOwnership(bid: AdminBidRecord) {
  const land = getBidLandSource(bid);

  return titleCase(
    firstString(
      land,
      ["kepemilikan", "ownership", "ownership_status", "status_kepemilikan"],
      "-"
    )
  );
}

function getBidLandArea(bid: AdminBidRecord) {
  const land = getBidLandSource(bid);

  const value = firstString(
    land,
    [
      "luas_lahan_m2",
      "area_m2",
      "land_area",
      "luas_lahan",
      "total_area",
      "data.luas_lahan_m2",
    ],
    "-"
  );

  return value === "-" ? "-" : `${value} m²`;
}

function isKtpUploaded(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return Boolean(
    firstDocumentValue(source, [
      "ktp_document",
      "ktp_photo",
      "ktp_file",
      "foto_ktp",
      "ktp_url",
      "identity_photo",
      "ktp_document_path",
      "data.ktp_document",
      "data.ktp_photo",
      "data.ktp_document_path",
    ]) ??
      firstDocumentValue(bid, [
        "supplier_profile.ktp_document_path",
        "supplier_profile.ktp_document",
        "supplier_profile.ktp_photo",
        "data.supplier_profile.ktp_document_path",
        "data.supplier_profile.ktp_document",
        "supplier.ktp_document",
        "data.supplier.ktp_document",
        "_bidder.ktp_document",
        "_bidder.ktp_document_path",
      ])
  );
}

function isNpwpUploaded(bid: AdminBidRecord) {
  const source = getBidSupplierSource(bid);

  return Boolean(
    firstDocumentValue(source, [
      "npwp_document",
      "npwp_photo",
      "npwp_file",
      "foto_npwp",
      "npwp_url",
      "npwp_document_path",
      "data.npwp_document",
      "data.npwp_photo",
      "data.npwp_document_path",
    ]) ??
      firstDocumentValue(bid, [
        "supplier_profile.npwp_document_path",
        "supplier_profile.npwp_document",
        "supplier_profile.npwp_photo",
        "data.supplier_profile.npwp_document_path",
        "data.supplier_profile.npwp_document",
        "supplier.npwp_document",
        "data.supplier.npwp_document",
        "_bidder.npwp_document",
        "_bidder.npwp_document_path",
      ])
  );
}

function getBidItemName(
  item: SupplierBidItemRecord,
  index: number,
  bountyItems: BountyItemRecord[]
) {
  const direct = firstString(
    item,
    [
      "bounty_item.item_name",
      "bounty_item.name",
      "data.bounty_item.item_name",
      "data.bounty_item.name",
      "item_name",
      "name",
    ],
    ""
  );

  if (direct) return direct;

  const bountyItemId = getBidItemBountyItemId(item);
  const matched = bountyItems.find((bountyItem, bountyIndex) => {
    return String(getItemId(bountyItem, String(bountyIndex + 1))) === String(bountyItemId);
  });

  return matched ? getItemName(matched, index) : `Item ${index + 1}`;
}

function getBidItemUnit(item: SupplierBidItemRecord, bountyItems: BountyItemRecord[]) {
  const direct = firstString(
    item,
    ["bounty_item.unit", "data.bounty_item.unit", "unit", "data.unit"],
    ""
  );

  if (direct) return direct;

  const bountyItemId = getBidItemBountyItemId(item);
  const matched = bountyItems.find((bountyItem, bountyIndex) => {
    return String(getItemId(bountyItem, String(bountyIndex + 1))) === String(bountyItemId);
  });

  return matched ? getItemUnit(matched) : "unit";
}

function getBidItemNote(item: SupplierBidItemRecord) {
  return firstString(item, ["catatan", "notes", "data.catatan", "data.notes"], "");
}

function getBidItemReviewStatus(item: SupplierBidItemRecord) {
  return firstString(
    item,
    [
      "review_status",
      "approval_status",
      "status",
      "data.review_status",
      "data.approval_status",
      "data.status",
    ],
    "pending"
  ).toLowerCase();
}

function getBidItemReviewerNote(item: SupplierBidItemRecord) {
  return firstString(
    item,
    [
      "reviewer_note",
      "admin_note",
      "catatan_admin",
      "review_note",
      "data.reviewer_note",
      "data.admin_note",
      "data.catatan_admin",
    ],
    ""
  );
}

function getBidItemProofUrl(item: SupplierBidItemRecord) {
  return firstString(
    item,
    [
      "proof_photo",
      "proof_url",
      "proof",
      "data.proof_photo",
      "data.proof_url",
      "data.proof",
    ],
    ""
  );
}

function getBidTotalQuantity(bid: AdminBidRecord) {
  return getBidItems(bid).reduce((total, item) => {
    return total + getBidItemQuantity(item);
  }, 0);
}

function getBidFulfillmentRate(bid: AdminBidRecord, bountyItems: BountyItemRecord[]) {
  const targetQty = bountyItems.reduce((total, item) => {
    return total + getItemQuantityNumber(item);
  }, 0);

  const proposedQty = getBidTotalQuantity(bid);

  if (!targetQty) return 0;

  return Math.min(100, Math.round((proposedQty / targetQty) * 1000) / 10);
}

function getBidStatus(bid: AdminBidRecord) {
  return titleCase(
    firstString(
      bid,
      ["status", "data.status", "bid.status", "_bidder.bid.status"],
      "submitted"
    )
  );
}

function getBidSubmittedAt(bid: AdminBidRecord) {
  return firstString(
    bid,
    [
      "submitted_at",
      "created_at",
      "updated_at",
      "data.submitted_at",
      "data.created_at",
      "bid.created_at",
      "_bidder.bid.created_at",
      "_bidder.created_at",
    ],
    "-"
  );
}

function getBidItemBountyItemId(item: SupplierBidItemRecord) {
  return firstString(
    item,
    ["bounty_item_id", "bounty_item.id", "data.bounty_item_id"],
    ""
  );
}

function getBidItemGrade(item: SupplierBidItemRecord | null) {
  return firstString(item, ["grade", "data.grade"], "-");
}

function getBidItemPrice(item: SupplierBidItemRecord | null) {
  if (!item) return 0;

  return firstNumber(
    item,
    ["estimasi_harga", "estimated_price", "price", "data.estimasi_harga"],
    0
  );
}

function getBidItemQuantity(item: SupplierBidItemRecord | null) {
  if (!item) return 0;

  return firstNumber(
    item,
    ["estimasi_kuantitas", "estimated_quantity", "quantity", "data.estimasi_kuantitas"],
    0
  );
}

function getBidEstimatedValue(bid: AdminBidRecord) {
  return getBidItems(bid).reduce((total, item) => {
    return total + getBidItemQuantity(item) * getBidItemPrice(item);
  }, 0);
}

function findBidItemForBountyItem(
  bid: AdminBidRecord,
  bountyItem: BountyItemRecord,
  fallbackId: string
) {
  const bountyItemId = getItemId(bountyItem, fallbackId);

  return (
    getBidItems(bid).find(
      (item) => String(getBidItemBountyItemId(item)) === String(bountyItemId)
    ) ?? null
  );
}

function getBiddingSummary(items: BountyItemRecord[], bids: AdminBidRecord[]): BiddingSummary {
  const targetQty = items.reduce((total, item) => total + getItemQuantityNumber(item), 0);

  const proposedQty = bids.reduce((total, bid) => {
    return (
      total +
      getBidItems(bid).reduce((itemTotal, item) => {
        return itemTotal + getBidItemQuantity(item);
      }, 0)
    );
  }, 0);

  const estimatedValue = bids.reduce((total, bid) => {
    return total + getBidEstimatedValue(bid);
  }, 0);

  return {
    totalBidders: bids.length,
    targetQty,
    proposedQty,
    estimatedValue,
    fulfillment:
      targetQty > 0 ? Math.min(100, Math.round((proposedQty / targetQty) * 1000) / 10) : 0,
  };
}

function getItemProgress(
  item: BountyItemRecord,
  index: number,
  bids: AdminBidRecord[]
): ItemProgress {
  const fallbackId = String(index + 1);
  const itemId = getItemId(item, fallbackId);
  const targetQty = getItemQuantityNumber(item);
  const unit = getItemUnit(item);

  const matchedBidItems = bids
    .map((bid) => findBidItemForBountyItem(bid, item, fallbackId))
    .filter((bidItem): bidItem is SupplierBidItemRecord => Boolean(bidItem));

  const proposedQty = matchedBidItems.reduce((total, bidItem) => {
    return total + getBidItemQuantity(bidItem);
  }, 0);

  const estimatedValue = matchedBidItems.reduce((total, bidItem) => {
    return total + getBidItemQuantity(bidItem) * getBidItemPrice(bidItem);
  }, 0);

  const averagePrice = proposedQty > 0 ? Math.round(estimatedValue / proposedQty) : 0;

  const gradePriority = ["A", "B", "C"];
  const grades = matchedBidItems.map((bidItem) => getBidItemGrade(bidItem).toUpperCase());
  const bestGrade = gradePriority.find((grade) => grades.includes(grade)) ?? "-";

  return {
    itemId,
    itemName: getItemName(item, index),
    unit,
    targetQty,
    proposedQty,
    fulfillment:
      targetQty > 0 ? Math.min(100, Math.round((proposedQty / targetQty) * 1000) / 10) : 0,
    bidCount: matchedBidItems.length,
    bestGrade,
    averagePrice,
  };
}
function toDateTimeLocalInput(value?: string | null) {
  if (!value || value === "-") return "";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().slice(0, 16);
}

function toBackendDateTime(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace("T", " ");

  const pad = (input: number) => String(input).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function createEditForm(detail: BountyDetailModel): EditBountyFormState {
  return {
    client_name: detail.clientName === "Client tidak tersedia" ? "" : detail.clientName,
    title: detail.title === "Untitled Bounty" ? "" : detail.title,
    description:
      detail.description === "Tidak ada deskripsi bounty." ? "" : detail.description,
    deadline_at: toDateTimeLocalInput(detail.deadlineAt),
    items:
      detail.items.length > 0
        ? detail.items.map((item, index) => ({
            item_name: getItemName(item, index),
            target_quantity: String(getItemQuantityNumber(item) || ""),
            unit: getItemUnit(item),
            notes: getItemNotes(item),
          }))
        : [
            {
              item_name: "",
              target_quantity: "",
              unit: "kg",
              notes: "",
            },
          ],
  };
}

function validateEditForm(form: EditBountyFormState) {
  if (!form.client_name.trim()) return "Client name wajib diisi.";
  if (!form.title.trim()) return "Title bounty wajib diisi.";
  if (!form.description.trim()) return "Description wajib diisi.";
  if (!form.deadline_at.trim()) return "Deadline wajib diisi.";

  if (!form.items.length) return "Minimal harus ada 1 item.";

  for (const [index, item] of form.items.entries()) {
    const row = index + 1;

    if (!item.item_name.trim()) return `Nama item baris ${row} wajib diisi.`;
    if (!item.unit.trim()) return `Unit item baris ${row} wajib diisi.`;

    const quantity = Number(item.target_quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return `Target quantity item baris ${row} wajib lebih dari 0.`;
    }
  }

  return null;
}

function buildEditPayload(form: EditBountyFormState): AdminBountyUpdatePayload {
  return {
    client_name: form.client_name.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    deadline_at: toBackendDateTime(form.deadline_at),
    items: form.items.map((item) => ({
      item_name: item.item_name.trim(),
      target_quantity: Number(item.target_quantity),
      unit: item.unit.trim(),
      ...(item.notes.trim() ? { notes: item.notes.trim() } : {}),
    })),
  };
}

function AdminBountyDetailView({ bountyId }: AdminBountyDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const [bounty, setBounty] = useState<AdminBountyRecord | null>(null);
  const [bids, setBids] = useState<AdminBidRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bidErrorMessage, setBidErrorMessage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditBountyFormState | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [selectedBidKey, setSelectedBidKey] = useState<string | null>(null);

  const detail = useMemo(() => {
    return bounty ? toDetailModel(bounty, bountyId) : null;
  }, [bounty, bountyId]);

  const isDraft = detail ? isDraftStatus(detail.status) : false;
  const statusMeta = detail ? getStatusMeta(detail.status) : null;

  const biddingSummary = useMemo(() => {
    return detail ? getBiddingSummary(detail.items, bids) : null;
  }, [detail, bids]);

  const itemProgress = useMemo(() => {
    return detail
      ? detail.items.map((item, index) => getItemProgress(item, index, bids))
      : [];
  }, [detail, bids]);

  useEffect(() => {
    if (!bids.length) {
      setSelectedBidKey(null);
      return;
    }

    const selectedExists = bids.some((bid, index) => {
      return getBidId(bid, index) === selectedBidKey;
    });

    if (!selectedExists) {
      setSelectedBidKey(getBidId(bids[0], 0));
    }
  }, [bids, selectedBidKey]);

  useEffect(() => {
    if (detail && isEditMode) {
      setEditForm(createEditForm(detail));
    }
  }, [detail, isEditMode]);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const bountyResponse = await getAdminBountyDetail(bountyId);
      const nextDetail = toDetailModel(bountyResponse, bountyId);
      const nextIsDraft = isDraftStatus(nextDetail.status);
      const bountyBidders = getBountyBidderRecords(bountyResponse);

      let nextBids: AdminBidRecord[] = [];
      let nextBidError: string | null = null;

      if (!nextIsDraft) {
        try {
          const bidsResponse = await getAdminBountyBids(bountyId);
          const rawBids = Array.isArray(bidsResponse)
            ? (bidsResponse as AdminBidRecord[])
            : [];

          nextBids = attachBiddersToBids(rawBids, bountyBidders);

          if (!nextBids.length && bountyBidders.length) {
            nextBids = createBidRecordsFromBidders(bountyBidders);
          }
        } catch (error) {
          nextBids = bountyBidders.length
            ? createBidRecordsFromBidders(bountyBidders)
            : [];

          nextBidError = bountyBidders.length
            ? null
            : error instanceof Error
              ? error.message
              : "Gagal memuat data bid.";
        }
      }

      setBounty(bountyResponse);
      setBids(nextBids);
      setErrorMessage(null);
      setBidErrorMessage(nextBidError);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bounty admin.";

      setBounty(null);
      setBids([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (mode === "initial") setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDetail("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bountyId]);

  const closeEditMode = () => {
  router.replace(`/admin/bounties/${encodeURIComponent(bountyId)}`);
};

const handleSaveDraft = async () => {
  if (!editForm) return;

  const validationError = validateEditForm(editForm);

  if (validationError) {
    toast.error(validationError);
    return;
  }

  setIsSavingDraft(true);

  try {
    await updateAdminBountyDraft(bountyId, buildEditPayload(editForm));
    await updateBountyStatus(bountyId, "draft");

    toast.success("Draft bounty berhasil disimpan.");
    await loadDetail("refresh");

    router.replace(`/admin/bounties/${encodeURIComponent(bountyId)}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menyimpan draft bounty.";
    toast.error(message);
  } finally {
    setIsSavingDraft(false);
  }
};

const updateEditForm = (patch: Partial<EditBountyFormState>) => {
  setEditForm((current) => (current ? { ...current, ...patch } : current));
};

const updateEditItem = (index: number, patch: Partial<EditBountyItemForm>) => {
  setEditForm((current) => {
    if (!current) return current;

    return {
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    };
  });
};

const addEditItem = () => {
  setEditForm((current) => {
    if (!current) return current;

    return {
      ...current,
      items: [
        ...current.items,
        {
          item_name: "",
          target_quantity: "",
          unit: "kg",
          notes: "",
        },
      ],
    };
  });
};

const removeEditItem = (index: number) => {
  setEditForm((current) => {
    if (!current) return current;

    if (current.items.length <= 1) {
      toast.error("Minimal harus ada 1 item.");
      return current;
    }

    return {
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    };
  });
};

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      await updateBountyStatus(bountyId, "published");
      toast.success("Bounty berhasil dipublish.");
      await loadDetail("refresh");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mempublish bounty.";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AdminShell
      title="Bounty Detail"
      description="Detail bounty, inventory requirements, dan status bidding."
      actions={
        <button
          type="button"
          onClick={() => loadDetail("refresh")}
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
      }
    >
      {isLoading ? null : errorMessage || !detail || !statusMeta ? (
        <section className="rounded-xl border border-error/15 bg-error-container p-5 shadow-sm">
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
      ) : isEditMode && editForm ? (
        <EditBountyDraftView
          detail={detail}
          form={editForm}
          isSavingDraft={isSavingDraft}
          onCancel={closeEditMode}
          onSaveDraft={handleSaveDraft}
          onChangeForm={updateEditForm}
          onChangeItem={updateEditItem}
          onAddItem={addEditItem}
          onRemoveItem={removeEditItem}
        />
      ) : isDraft ? (
        <DraftBountyDetail
          detail={detail}
          statusMeta={statusMeta}
          biddingSummary={biddingSummary}
          itemProgress={itemProgress}
          isPublishing={isPublishing}
          onPublish={handlePublish}
        />
      ) : (
        <PublishedBountyDetail
          detail={detail}
          statusMeta={statusMeta}
          biddingSummary={biddingSummary}
          itemProgress={itemProgress}
          bids={bids}
          bidErrorMessage={bidErrorMessage}
          selectedBidKey={selectedBidKey}
          onSelectBid={setSelectedBidKey}
        />
      )}
    </AdminShell>
  );
}

function DraftBountyDetail({
  detail,
  statusMeta,
  biddingSummary,
  itemProgress,
  isPublishing,
  onPublish,
}: {
  detail: BountyDetailModel;
  statusMeta: ReturnType<typeof getStatusMeta>;
  biddingSummary: BiddingSummary | null;
  itemProgress: ItemProgress[];
  isPublishing: boolean;
  onPublish: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 pb-10">
      <DraftHero
        detail={detail}
        statusMeta={statusMeta}
        isPublishing={isPublishing}
        onPublish={onPublish}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OverviewCard description={detail.description} />
          <InventoryRequirementsCard items={detail.items} />
          <DraftBiddingProgressCard itemProgress={itemProgress} />
        </div>

        <aside className="space-y-6">
          <BiddingOverviewCard
            isDraft
            bidErrorMessage={null}
            summary={biddingSummary}
          />
          <ClientDetailsCard clientName={detail.clientName} />
          <AuditLogCard detail={detail} bidsCount={0} />
        </aside>
      </section>
    </main>
  );
}

function PublishedBountyDetail({
  detail,
  statusMeta,
  biddingSummary,
  itemProgress,
  bids,
  bidErrorMessage,
  selectedBidKey,
  onSelectBid,
}: {
  detail: BountyDetailModel;
  statusMeta: ReturnType<typeof getStatusMeta>;
  biddingSummary: BiddingSummary | null;
  itemProgress: ItemProgress[];
  bids: AdminBidRecord[];
  bidErrorMessage: string | null;
  selectedBidKey: string | null;
  onSelectBid: (bidKey: string) => void;
}) {
  const selectedBid =
    bids.find((bid, index) => getBidId(bid, index) === selectedBidKey) ??
    bids[0] ??
    null;

  return (
    <main className="mx-auto w-full max-w-screen-2xl space-y-6 pb-10">
      <section className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
        <Link
          href="/admin/bounties"
          className="inline-flex items-center gap-1 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Bounties
        </Link>
        <span>/</span>
        <span className="text-on-surface-variant">Bounty Detail</span>
      </section>

      <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusMeta.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`} />
              {statusMeta.label}
            </span>

            <span className="text-sm font-bold text-secondary">{detail.code}</span>
          </div>

          <h1 className="break-words font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {detail.title}{" "}
            <span className="font-body text-2xl font-normal text-secondary">
              ({detail.clientName})
            </span>
          </h1>

          <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
            {detail.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/bounties/${encodeURIComponent(detail.id)}?mode=edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => toast.info("Popup extend deadline akan dipasang setelah endpoint action dikunci.")}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low"
          >
            <CalendarDays className="h-4 w-4" />
            Extend Deadline
          </button>

          <button
            type="button"
            onClick={() => toast.info("Popup update status akan dipasang setelah endpoint action dikunci.")}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low"
          >
            <RefreshCw className="h-4 w-4" />
            Update Status
          </button>

          <button
            type="button"
            onClick={() => {
              const target = document.getElementById("admin-bid-review-workspace");
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            <Gavel className="h-4 w-4" />
            Manage Bids
          </button>
        </div>
      </section>

      {bidErrorMessage ? (
        <section className="rounded-xl border border-error/10 bg-error-container p-4 text-sm text-on-error-container">
          {bidErrorMessage}
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ReviewKpiCard
          icon={Users}
          label="Total Bidders"
          value={String(biddingSummary?.totalBidders ?? 0)}
        />
        <ReviewKpiCard
          icon={ClipboardList}
          label="Requested Items"
          value={String(detail.items.length)}
        />
        <ReviewKpiCard
          icon={CalendarDays}
          label="Deadline"
          value={formatDate(detail.deadlineAt)}
          subvalue={
            isDeadlineExtended(detail)
              ? `Extended from ${formatDate(detail.originalDeadlineAt)}`
              : undefined
          }
          danger={isDeadlineExtended(detail)}
        />
        <ReviewKpiCard
          icon={CheckCircle2}
          label="Overall Fulfillment"
          value={`${biddingSummary?.fulfillment ?? 0}%`}
          subvalue="Est."
          primary
        />
      </section>

      <section
        id="admin-bid-review-workspace"
        className="grid grid-cols-1 gap-6 xl:grid-cols-12"
      >
        <div className="space-y-6 xl:col-span-4">
          <ReviewFulfillmentProgress itemProgress={itemProgress} />

          <SubmittedBidSelector
            bountyId={detail.id}
            selectedBidKey={selectedBidKey}
            onSelectBid={onSelectBid}
            bids={bids}
            bountyItems={detail.items}
          />
        </div>

        <div className="xl:col-span-8">
          <BidReviewWorkspace
            bountyId={detail.id}
            bountyItems={detail.items}
            bid={selectedBid}
            bidIndex={selectedBid ? bids.indexOf(selectedBid) : -1}
          />
        </div>
      </section>
    </main>
  );
}

function DraftHero({
  detail,
  statusMeta,
  isPublishing,
  onPublish,
}: {
  detail: BountyDetailModel;
  statusMeta: ReturnType<typeof getStatusMeta>;
  isPublishing: boolean;
  onPublish: () => void;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.06)] md:p-8">
      <div className="mb-6 flex items-center gap-2 text-sm font-medium text-secondary">
        <Link
          href="/admin/bounties"
          className="inline-flex items-center gap-1 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bounties
        </Link>
        <span>/</span>
        <span className="text-on-surface-variant">{detail.code}</span>
      </div>

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
              {detail.code}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusMeta.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`} />
              {statusMeta.label}
            </span>
          </div>

          <h1 className="break-words font-headline text-3xl font-bold text-on-surface">
            {detail.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="h-4 w-4" />
              {detail.clientName}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Deadline: {formatDate(detail.deadlineAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/bounties/${encodeURIComponent(detail.id)}?mode=edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-highest"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Link>

          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Bounty
          </button>

          <button
            type="button"
            onClick={() => toast.info("Endpoint delete bounty belum tersedia di Postman.")}
            className="inline-flex items-center justify-center rounded-xl p-2.5 text-error transition hover:bg-error-container/50"
            aria-label="Delete bounty"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function EditBountyDraftView({
  detail,
  form,
  isSavingDraft,
  onCancel,
  onSaveDraft,
  onChangeForm,
  onChangeItem,
  onAddItem,
  onRemoveItem,
}: {
  detail: BountyDetailModel;
  form: EditBountyFormState;
  isSavingDraft: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onChangeForm: (patch: Partial<EditBountyFormState>) => void;
  onChangeItem: (index: number, patch: Partial<EditBountyItemForm>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6 pb-10">
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.06)] md:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium text-secondary">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Detail
          </button>
          <span>/</span>
          <span className="text-on-surface-variant">Edit Draft {detail.code}</span>
        </div>

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <span className="inline-flex rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold uppercase text-on-surface-variant">
              Draft Edit Mode
            </span>

            <h1 className="mt-3 font-headline text-3xl font-bold text-on-surface">
              Edit Bounty Draft
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Ubah data bounty, item kebutuhan, dan deadline. Klik Save Draft untuk
              menyimpan perubahan tanpa mempublish bounty.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="mb-5 font-headline text-lg font-bold text-on-surface">
              Bounty Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Client Name">
                <input
                  value={form.client_name}
                  onChange={(event) =>
                    onChangeForm({ client_name: event.target.value })
                  }
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                  placeholder="PT Segar Abadi"
                />
              </FormField>

              <FormField label="Deadline">
                <input
                  type="datetime-local"
                  value={form.deadline_at}
                  onChange={(event) =>
                    onChangeForm({ deadline_at: event.target.value })
                  }
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Title">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      onChangeForm({ title: event.target.value })
                    }
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                    placeholder="Kebutuhan Sayuran Minggu Ini"
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      onChangeForm({ description: event.target.value })
                    }
                    rows={5}
                    className="w-full resize-none rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                    placeholder="Untuk kebutuhan restoran cabang Bandung"
                  />
                </FormField>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Inventory Items
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Item ini akan dikirim ke backend sebagai array `items`.
                </p>
              </div>

              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {form.items.map((item, index) => (
                <article
                  key={`edit-item-${index}`}
                  className="rounded-xl border border-outline-variant/15 bg-surface p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-on-surface">
                      Item #{index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-error transition hover:bg-error-container"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <FormField label="Item Name">
                        <input
                          value={item.item_name}
                          onChange={(event) =>
                            onChangeItem(index, { item_name: event.target.value })
                          }
                          className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                          placeholder="Bayam"
                        />
                      </FormField>
                    </div>

                    <FormField label="Target Qty">
                      <input
                        type="number"
                        min="0"
                        value={item.target_quantity}
                        onChange={(event) =>
                          onChangeItem(index, {
                            target_quantity: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                        placeholder="50"
                      />
                    </FormField>

                    <FormField label="Unit">
                      <input
                        value={item.unit}
                        onChange={(event) =>
                          onChangeItem(index, { unit: event.target.value })
                        }
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                        placeholder="kg"
                      />
                    </FormField>

                    <div className="md:col-span-4">
                      <FormField label="Notes">
                        <input
                          value={item.notes}
                          onChange={(event) =>
                            onChangeItem(index, { notes: event.target.value })
                          }
                          className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                          placeholder="Pilih yang segar"
                        />
                      </FormField>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Save Behavior
            </h2>

            <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
              <p>
                <span className="font-bold text-on-surface">Save Draft</span>{" "}
                akan update data bounty dan memastikan status tetap draft.
              </p>
              <p>
                Tombol ini tidak akan mempublish bounty. Publish tetap memakai tombol
                Publish Bounty di halaman detail draft.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Payload Preview
            </h2>

            <div className="mt-4 rounded-xl bg-surface-container-low p-4 text-xs text-on-surface-variant">
              <p>client_name: {form.client_name || "-"}</p>
              <p>title: {form.title || "-"}</p>
              <p>deadline_at: {form.deadline_at || "-"}</p>
              <p>items: {form.items.length}</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function OverviewCard({ description }: { description: string }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">
        Bounty Overview
      </h2>
      <p className="text-sm leading-7 text-on-surface-variant">{description}</p>
    </section>
  );
}

function InventoryRequirementsCard({ items }: { items: BountyItemRecord[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <div className="flex items-center justify-between border-b border-outline-variant/15 bg-surface-bright p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Inventory Requirements
        </h2>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {items.length} Items
        </span>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Package2}
            title="No inventory items"
            description="Bounty ini belum memiliki item permintaan."
          />
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const notes = getItemNotes(item);

              return (
                <div
                  key={`${getItemId(item, String(index + 1))}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant/15 bg-surface p-4 transition hover:bg-surface-container-low"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-secondary">
                      <Package2 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-on-surface">
                        {getItemName(item, index)}
                      </p>
                      <p className="mt-1 break-words text-xs text-on-surface-variant">
                        {notes ? (
                          <span className="inline-flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {notes}
                          </span>
                        ) : (
                          "No notes provided"
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="shrink-0 text-right text-sm font-bold text-on-surface">
                    {getItemQuantityLabel(item)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function DraftBiddingProgressCard({ itemProgress }: { itemProgress: ItemProgress[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <div className="border-b border-outline-variant/15 bg-surface-bright p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Bidding Progress by Item
        </h2>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15 text-on-surface-variant">
                <th className="w-1/3 pb-3 font-semibold">Item Name</th>
                <th className="w-1/4 pb-3 font-semibold">Target</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/10">
              {itemProgress.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-5 text-center text-on-surface-variant">
                    Belum ada item untuk dipantau.
                  </td>
                </tr>
              ) : (
                itemProgress.map((item) => (
                  <tr key={item.itemId}>
                    <td className="py-4 font-medium text-on-surface">{item.itemName}</td>
                    <td className="py-4 text-on-surface-variant">
                      {item.targetQty} {item.unit}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                        No bids submitted
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PublishedItemProgressCard({ itemProgress }: { itemProgress: ItemProgress[] }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_2px_12px_rgba(25,28,30,0.03)]">
      <h2 className="mb-6 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
        <Package2 className="h-5 w-5 text-secondary" />
        Requested Items & Progress
      </h2>

      {itemProgress.length === 0 ? (
        <EmptyState
          icon={Package2}
          title="No requested items"
          description="Bounty ini belum memiliki item permintaan."
        />
      ) : (
        <div className="space-y-6">
          {itemProgress.map((item) => (
            <ItemProgressCard key={item.itemId} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function BiddingOverviewCard({
  isDraft,
  bidErrorMessage,
  summary,
}: {
  isDraft: boolean;
  bidErrorMessage: string | null;
  summary: BiddingSummary | null;
}) {
  const totalBidders = summary?.totalBidders ?? 0;
  const fulfillment = summary?.fulfillment ?? 0;

  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">
        Bidding Overview
      </h2>

      {bidErrorMessage ? (
        <div className="mb-4 rounded-xl border border-error/10 bg-error-container p-4 text-sm text-on-error-container">
          {bidErrorMessage}
        </div>
      ) : null}

      {totalBidders <= 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-dashed border-outline-variant/15 bg-surface p-6 text-center">
          <Hourglass className="h-10 w-10 text-secondary opacity-50" />
          <div>
            <h3 className="font-headline text-sm font-bold text-on-surface">
              No bids yet
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              {isDraft
                ? "This bounty is currently in Draft status. Publish to start receiving bids."
                : "Belum ada supplier yang mengajukan bid untuk bounty ini."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-4">
          <p className="text-sm font-bold text-primary">
            {totalBidders} supplier sudah mengajukan bid
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Progress fulfillment dihitung dari total quantity yang diajukan supplier.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <MetricCard label="Fulfillment" value={`${fulfillment}%`} />
        <MetricCard label="Total Bidders" value={String(totalBidders)} />
      </div>
    </section>
  );
}

function ReviewKpiCard({
  icon: Icon,
  label,
  value,
  subvalue,
  primary = false,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subvalue?: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <article
      className={
        primary
          ? "relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6"
          : "rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm"
      }
    >
      <div
        className={
          primary
            ? "mb-3 flex items-center gap-2 text-primary"
            : "mb-3 flex items-center gap-2 text-secondary"
        }
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>

      <div
        className={
          primary
            ? "font-headline text-3xl font-bold text-primary"
            : "font-headline text-3xl font-bold text-on-surface"
        }
      >
        {value}
      </div>

      {subvalue ? (
        <div
          className={
            danger
              ? "mt-1 text-[10px] font-bold uppercase text-error"
              : "mt-1 text-xs font-medium text-secondary"
          }
        >
          {subvalue}
        </div>
      ) : null}
    </article>
  );
}

function ReviewFulfillmentProgress({ itemProgress }: { itemProgress: ItemProgress[] }) {
  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface">
        <TrendingUp className="h-5 w-5 text-primary" />
        Fulfillment Progress
      </h2>

      {itemProgress.length === 0 ? (
        <EmptyState
          icon={Package2}
          title="No requested items"
          description="Belum ada item untuk dipantau."
        />
      ) : (
        <div className="space-y-6">
          {itemProgress.map((item) => {
            const barClass =
              item.fulfillment >= 90
                ? "bg-primary"
                : item.fulfillment >= 70
                  ? "bg-yellow-500"
                  : item.fulfillment > 0
                    ? "bg-tertiary"
                    : "bg-surface-container-high";

            return (
              <div key={item.itemId} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-on-surface">{item.itemName}</span>
                  <span className="text-xs font-bold text-primary">
                    {item.fulfillment}%
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-1.5 rounded-full ${barClass}`}
                    style={{ width: `${Math.min(100, item.fulfillment)}%` }}
                  />
                </div>

                <div className="flex justify-between gap-3 text-[10px] font-bold uppercase text-secondary">
                  <span>
                    {item.bestGrade === "-" ? "No Grade" : `Grade ${item.bestGrade}`}
                    {item.averagePrice > 0
                      ? ` • ${formatCurrency(item.averagePrice)}/${item.unit}`
                      : ""}
                  </span>
                  <span>
                    {item.proposedQty}/{item.targetQty}
                    {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SubmittedBidSelector({
  bountyId,
  selectedBidKey,
  onSelectBid,
  bids,
  bountyItems,
}: {
  bountyId: string;
  selectedBidKey: string | null;
  onSelectBid: (bidKey: string) => void;
  bids: AdminBidRecord[];
  bountyItems: BountyItemRecord[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
          Submitted Bids ({bids.length})
        </h2>
      </div>

      {bids.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest p-6 text-center">
          <Hourglass className="mx-auto h-8 w-8 text-secondary opacity-60" />
          <p className="mt-3 text-sm font-bold text-on-surface">
            No submitted bids
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Belum ada supplier yang masuk.
          </p>
        </div>
      ) : (
        bids.map((bid, index) => {
          const bidKey = getBidId(bid, index);
          const isSelected = selectedBidKey === bidKey;
          const supplierName = getBidSupplierName(bid);
          const username = getBidSupplierUsername(bid);
          const notes = getBidNotes(bid);
          const fulfillment = getBidFulfillmentRate(bid, bountyItems);
          const detailHref = `/admin/bounties/${encodeURIComponent(
            bountyId
          )}/bids/${encodeURIComponent(bidKey)}`;

          return (
            <article
              key={`${bidKey}-${index}`}
              onClick={() => onSelectBid(bidKey)}
              className={
                isSelected
                  ? "relative w-full overflow-hidden rounded-2xl border-2 border-primary bg-surface-container-lowest p-5 text-left shadow-sm"
                  : "relative w-full overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 text-left shadow-sm transition hover:border-primary/40"
              }
            >
              {isSelected ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Selected
                </span>
              ) : null}

              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                  {getBidSupplierInitials(supplierName)}
                </div>

                <div className="min-w-0">
                  <h3 className="break-words font-bold text-on-surface">
                    {supplierName}
                  </h3>
                  <p className="text-xs text-secondary">
                    {username ? `@${username}` : `Bid ID ${bidKey}`}
                  </p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-container-low p-2">
                  <p className="mb-1 text-[9px] font-bold uppercase text-secondary">
                    Approval
                  </p>
                  <span className="text-[10px] font-bold text-primary">
                    {getBidApprovalLabel(bid)}
                  </span>
                </div>

                <div className="rounded-lg bg-surface-container-low p-2">
                  <p className="mb-1 text-[9px] font-bold uppercase text-secondary">
                    Survey
                  </p>
                  <span className="text-[10px] font-bold text-secondary">
                    {getBidSurveyLabel(bid)}
                  </span>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-surface-container-low p-2">
                <p className="mb-1 text-[9px] font-bold uppercase text-secondary">
                  Fulfillment
                </p>
                <span className="text-[10px] font-bold text-primary">
                  {fulfillment}%
                </span>
              </div>

              {notes ? (
                <p className="mb-4 line-clamp-2 text-xs italic text-on-surface-variant">
                  "{notes}"
                </p>
              ) : null}

              <Link
                href={detailHref}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex w-full items-center justify-center rounded-xl border border-primary px-3 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/5"
              >
                View Bid Detail
              </Link>
            </article>
          );
        })
      )}
    </section>
  );
}

function BidReviewWorkspace({
  bountyId,
  bountyItems,
  bid,
  bidIndex,
}: {
  bountyId: string;
  bountyItems: BountyItemRecord[];
  bid: AdminBidRecord | null;
  bidIndex: number;
}) {
  if (!bid) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest p-10 text-center shadow-sm">
        <Hourglass className="mx-auto h-10 w-10 text-secondary opacity-60" />
        <h2 className="mt-4 font-headline text-lg font-bold text-on-surface">
          No bid selected
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Pilih bid supplier di sisi kiri untuk mulai review.
        </p>
      </section>
    );
  }

  const bidId = getBidId(bid, bidIndex);
  const supplierName = getBidSupplierName(bid);
  const supplierPhone = getBidSupplierPhone(bid);
  const supplierLocation = getBidSupplierLocation(bid);
  const bidItems = getBidItems(bid);

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-outline-variant/10 bg-surface-container-low p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 font-headline text-xl font-black text-primary">
              {getBidSupplierInitials(supplierName)}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {supplierName}
              </h2>

              <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Supplier Verified
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-secondary">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {supplierPhone}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {supplierLocation}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DocumentBadge
            active={isKtpUploaded(bid)}
            activeLabel="KTP Uploaded"
            inactiveLabel="KTP Missing"
          />
          <DocumentBadge
            active={isNpwpUploaded(bid)}
            activeLabel="NPWP Uploaded"
            inactiveLabel="NPWP Missing"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <aside className="space-y-6 border-outline-variant/10 lg:border-r lg:pr-6">
          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-secondary">
              Land Information
            </h3>

            <div className="space-y-4">
              <ReviewFact label="Location" value={getBidLandLocation(bid)} />
              <ReviewFact label="Status" value={getBidLandOwnership(bid)} />
              <ReviewFact label="Total Area" value={getBidLandArea(bid)} />
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-5">
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-secondary">
              Audit Timeline
            </h3>

            <div className="space-y-4">
              <MiniAuditItem
                tone="primary"
                title="Bid Submitted"
                meta={formatDateTime(getBidSubmittedAt(bid))}
              />
              <MiniAuditItem title="Bounty Published" meta="System" />
              <MiniAuditItem title={`Bid ID ${bidId}`} meta={`Bounty ${bountyId}`} />
            </div>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Item-by-Item Review
          </h3>

          {bidItems.length === 0 ? (
            <EmptyState
              icon={Package2}
              title="No bid items"
              description="Bid ini belum memiliki item."
            />
          ) : (
            bidItems.map((item, index) => (
              <BidItemReviewCard
                key={`${getBidItemBountyItemId(item)}-${index}`}
                item={item}
                index={index}
                bountyItems={bountyItems}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-outline-variant/10 bg-surface-container-low p-6">
        <button
          type="button"
          onClick={() => toast.info("Discard draft review akan dipasang pada tahap detail bid.")}
          className="rounded-xl px-6 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-container-high"
        >
          Discard Draft
        </button>

        <button
          type="button"
          onClick={() => toast.info("Finalize review akan dipasang setelah approve/reject item detail dibuat.")}
          className="rounded-xl bg-primary px-8 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          Finalize Review
        </button>
      </div>
    </section>
  );
}

function DocumentBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <div
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"
          : "inline-flex items-center gap-1.5 rounded-lg border border-error/20 bg-error/5 px-3 py-1.5 text-xs font-bold text-error"
      }
    >
      {active ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
      {active ? activeLabel : inactiveLabel}
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-right text-sm font-bold text-on-surface">{value}</span>
    </div>
  );
}

function MiniAuditItem({
  title,
  meta,
  tone = "default",
}: {
  title: string;
  meta: string;
  tone?: "default" | "primary" | "error";
}) {
  const dotClass =
    tone === "primary"
      ? "bg-primary"
      : tone === "error"
        ? "bg-error"
        : "bg-surface-container-highest";

  return (
    <div className="flex gap-3">
      <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <div>
        <p className="text-[11px] font-bold text-on-surface">{title}</p>
        <p className="mt-0.5 text-[10px] text-secondary">{meta}</p>
      </div>
    </div>
  );
}

function BidItemReviewCard({
  item,
  index,
  bountyItems,
}: {
  item: SupplierBidItemRecord;
  index: number;
  bountyItems: BountyItemRecord[];
}) {
  const status = getBidItemReviewStatus(item);
  const qty = getBidItemQuantity(item);
  const price = getBidItemPrice(item);
  const unit = getBidItemUnit(item, bountyItems);
  const reviewerNote = getBidItemReviewerNote(item);
  const supplierNote = getBidItemNote(item);
  const proofUrl = getBidItemProofUrl(item);

  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const statusClass = isApproved
    ? "bg-primary/10 text-primary border-primary/20"
    : isRejected
      ? "bg-error/10 text-error border-error/20"
      : "bg-surface-container-high text-secondary border-outline-variant/20";

  return (
    <article
      className={
        isApproved
          ? "rounded-xl border border-primary/20 bg-surface-container-lowest p-5 shadow-sm ring-1 ring-primary/5"
          : "rounded-xl border border-outline-variant/15 bg-surface-container-low p-5"
      }
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="flex flex-wrap items-center gap-2 font-bold text-on-surface">
            {getBidItemName(item, index, bountyItems)}
            <span className="rounded border bg-surface-container-lowest px-2 py-0.5 text-[10px] font-bold text-secondary">
              Grade {getBidItemGrade(item)}
            </span>
          </h4>

          <p className="mt-1 text-xs text-secondary">
            Quoted: {qty}
            {unit} • {formatCurrency(price)}/{unit}
          </p>

          {supplierNote ? (
            <p className="mt-2 text-xs italic text-on-surface-variant">
              "{supplierNote}"
            </p>
          ) : null}
        </div>

        <span
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass}`}
        >
          {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
        </span>
      </div>

      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-3">
        <p className="mb-1 text-[10px] font-bold uppercase text-secondary">
          Reviewer Note
        </p>
        <p className="text-xs text-on-surface">
          {reviewerNote || "Belum ada catatan reviewer."}
        </p>
      </div>

      <div className="mt-4">
        {proofUrl ? (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase text-secondary">
              Quality Proof
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/15 bg-surface-container-low">
                <FileImage className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface">
                  Proof attached
                </p>
                <p className="text-[10px] text-secondary">
                  Available from API response
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs italic text-secondary">
            <CircleDashed className="h-4 w-4" />
            No proof attached
          </div>
        )}
      </div>
    </article>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subvalue,
  emphasis = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subvalue?: string;
  emphasis?: "default" | "primary" | "tertiary";
}) {
  const textClass =
    emphasis === "primary"
      ? "text-primary"
      : emphasis === "tertiary"
        ? "text-tertiary"
        : "text-on-surface";

  return (
    <article className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-[0_2px_12px_rgba(25,28,30,0.03)]">
      {emphasis === "primary" ? <div className="absolute inset-0 bg-primary/5" /> : null}

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2 text-secondary">
          <Icon className="h-[18px] w-[18px]" />
          <span className="text-sm font-medium">{label}</span>
        </div>

        <div className={`font-headline text-2xl font-bold md:text-3xl ${textClass}`}>
          {value}
        </div>

        {subvalue ? <div className="mt-1 text-xs font-medium text-secondary">{subvalue}</div> : null}
      </div>
    </article>
  );
}

function ItemProgressCard({ item }: { item: ItemProgress }) {
  const isEmpty = item.bidCount <= 0;
  const barClass =
    item.fulfillment >= 90
      ? "bg-primary"
      : item.fulfillment >= 70
        ? "bg-yellow-500"
        : item.fulfillment > 0
          ? "bg-tertiary"
          : "bg-surface-container-high";

  const textClass =
    item.fulfillment >= 90
      ? "text-primary"
      : item.fulfillment >= 70
        ? "text-yellow-600"
        : item.fulfillment > 0
          ? "text-tertiary"
          : "text-secondary";

  return (
    <article className="rounded-lg bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="break-words font-headline text-lg font-bold text-on-surface">
            {item.itemName}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
              {item.bestGrade === "A" ? (
                <Star className="h-3.5 w-3.5" />
              ) : (
                <StarHalf className="h-3.5 w-3.5" />
              )}
              {isEmpty ? "No Grade" : `Grade ${item.bestGrade}`}
            </span>

            <span className="text-sm text-secondary">
              Target: {item.targetQty} {item.unit}
            </span>

            <span className="text-sm text-secondary">
              {item.bidCount} bid{item.bidCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-headline font-bold text-on-surface">
            {isEmpty ? "-" : formatCurrency(item.averagePrice)}
            {!isEmpty ? (
              <span className="text-sm font-normal text-secondary">/{item.unit}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-secondary">
            Fulfillment Status ({item.proposedQty} {item.unit} submitted)
          </span>
          <span className={`font-bold ${textClass}`}>{item.fulfillment}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div
            className={`h-2 rounded-full ${barClass}`}
            style={{ width: `${Math.min(100, item.fulfillment)}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function ClientDetailsCard({ clientName }: { clientName: string }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">
        Client Details
      </h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container font-headline text-lg font-bold text-on-secondary-container">
          {getClientInitial(clientName)}
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-on-surface">{clientName}</p>
          <p className="text-xs text-on-surface-variant">Corporate Client</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => toast.info("Detail profile client belum tersedia di endpoint.")}
        className="w-full rounded-lg border border-outline-variant/30 bg-surface py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
      >
        View Profile
      </button>
    </section>
  );
}

function AuditLogCard({
  detail,
  bidsCount,
}: {
  detail: BountyDetailModel;
  bidsCount: number;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">
        Audit Log
      </h2>

      <div className="relative space-y-4 border-l-2 border-surface-container-high pl-4">
        {isDeadlineExtended(detail) ? (
          <AuditItem
            tone="primary"
            title="Deadline Extended"
            description={`Moved from ${formatDate(detail.originalDeadlineAt)} to ${formatDate(
              detail.deadlineAt
            )}`}
          />
        ) : null}

        {detail.status.toLowerCase() !== "draft" ? (
          <AuditItem
            title="Bounty Published"
            description={`Status changed from Draft to Published on ${formatDateTime(
              detail.updatedAt
            )}`}
          />
        ) : null}

        <AuditItem
          title="Bounty Created"
          description={`by ${detail.createdBy} on ${formatDateTime(detail.createdAt)}`}
        />

        {bidsCount > 0 ? (
          <AuditItem
            title="Bid Data Loaded"
            description={`${bidsCount} submitted bid record detected`}
          />
        ) : null}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/10 bg-surface p-4">
      <p className="mb-1 text-xs text-on-surface-variant">{label}</p>
      <p className="font-headline text-xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface p-8 text-center">
      <Icon className="h-10 w-10 text-secondary opacity-50" />
      <h3 className="mt-3 font-headline text-sm font-bold text-on-surface">{title}</h3>
      <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
    </div>
  );
}

function AuditItem({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="relative">
      <div
        className={
          tone === "primary"
            ? "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest"
            : "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-secondary ring-4 ring-surface-container-lowest"
        }
      />
      <p className="text-xs font-semibold text-on-surface">{title}</p>
      <p className="mt-0.5 text-[11px] text-on-surface-variant">{description}</p>
    </div>
  );
}

export { AdminBountyDetailView };
export default AdminBountyDetailView;