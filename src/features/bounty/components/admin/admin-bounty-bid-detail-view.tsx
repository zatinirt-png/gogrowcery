"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  Hourglass,
  Info,
  Loader2,
  MapPin,
  Package2,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldX,
  UserRound,
  XCircle,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import {
  approveAdminBountyBidItem,
  getAdminBountyBidDetail,
  getAdminBountyBids,
  getAdminBountyDetail,
  type AdminBidItemApprovalStatus,
} from "@/features/bounty/api";
import type {
  AdminBidRecord,
  AdminBountyRecord,
  BountyItemRecord,
  SupplierBidItemRecord,
} from "@/features/bounty/types";

type AdminBountyBidDetailViewProps = {
  bountyId: string;
  bidId: string;
};

type BidderRecord = {
  id?: number | string | null;
  nama_lengkap?: string | null;
  name?: string | null;
  username?: string | null;
  no_hp?: string | null;
  phone?: string | null;
  alamat_domisili?: string | null;
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  approval_status?: string | null;
  survey_status?: string | null;
  registered_by_admin?: boolean | number | string | null;
  ktp_document_path?: string | null;
  npwp_document_path?: string | null;
  lands?: Array<Record<string, unknown>>;
  user?: {
    id?: number | string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    is_active?: boolean | number | string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type BidRecord = AdminBidRecord & {
  supplier_profile_id?: number | string | null;
  supplier_profile?: BidderRecord | null;
  supplierProfile?: BidderRecord | null;
  supplier?: BidderRecord | null;
  bidder?: BidderRecord | null;
  user?: BidderRecord | null;
  revised_at?: string | null;
  withdrawn_at?: string | null;
  [key: string]: unknown;
};

type ApprovalModalState = {
  item: SupplierBidItemRecord;
  index: number;
  status: AdminBidItemApprovalStatus;
  catatan: string;
  proofPhoto: File | null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getBountyItems(bounty: AdminBountyRecord | null) {
  if (!bounty) return [];

  if (Array.isArray(bounty.items)) return bounty.items;
  if (Array.isArray(bounty.bounty_items)) return bounty.bounty_items;

  const dataItems = getNestedValue(bounty, "data.items");
  if (Array.isArray(dataItems)) return dataItems as BountyItemRecord[];

  const dataBountyItems = getNestedValue(bounty, "data.bounty_items");
  if (Array.isArray(dataBountyItems)) return dataBountyItems as BountyItemRecord[];

  return [];
}

function getBidItems(bid: BidRecord | null) {
  if (!bid) return [];

  if (Array.isArray(bid.items)) return bid.items;
  if (Array.isArray(bid.bid_items)) return bid.bid_items;

  const dataItems = getNestedValue(bid, "data.items");
  if (Array.isArray(dataItems)) return dataItems as SupplierBidItemRecord[];

  const dataBidItems = getNestedValue(bid, "data.bid_items");
  if (Array.isArray(dataBidItems)) return dataBidItems as SupplierBidItemRecord[];

  return [];
}

function getSupplierSource(bid: BidRecord | null) {
  if (!bid) return null;

  const candidates = [
    asRecord(getNestedValue(bid, "supplier_profile")),
    asRecord(getNestedValue(bid, "supplierProfile")),
    asRecord(getNestedValue(bid, "data.supplier_profile")),
    asRecord(getNestedValue(bid, "supplier")),
    asRecord(getNestedValue(bid, "bidder")),
    asRecord(getNestedValue(bid, "user")),
    asRecord(getNestedValue(bid, "profile")),
  ].filter(Boolean) as Record<string, unknown>[];

  return candidates[0] ?? null;
}

function getSupplierName(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return firstString(
    supplier,
    ["nama_lengkap", "full_name", "name", "user.name", "user.username", "username"],
    firstString(bid, ["supplier_name", "bidder_name", "user_name"], "Supplier")
  );
}

function getSupplierUsername(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return firstString(
    supplier,
    ["user.username", "username", "data.user.username", "data.username"],
    ""
  );
}

function getSupplierPhone(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return firstString(
    supplier,
    ["no_hp", "phone", "user.phone", "data.no_hp", "data.phone"],
    "-"
  );
}

function getSupplierAddress(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  const address = firstString(supplier, ["alamat_domisili", "alamat", "address"], "");
  const village = firstString(supplier, ["desa"], "");
  const district = firstString(supplier, ["kecamatan"], "");
  const city = firstString(supplier, ["kabupaten", "city"], "");
  const province = firstString(supplier, ["provinsi"], "");

  const parts = [address, village, district, city, province].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function getSupplierBirthInfo(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);
  const place = firstString(supplier, ["tempat_lahir"], "");
  const date = formatDate(firstString(supplier, ["tanggal_lahir"], ""));

  if (!place && date === "-") return "-";
  if (!place) return date;
  if (date === "-") return place;

  return `${place}, ${date}`;
}

function getSupplierApprovalStatus(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return titleCase(firstString(supplier, ["approval_status"], "pending"));
}

function getSupplierSurveyStatus(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return titleCase(firstString(supplier, ["survey_status"], "belum_survey"));
}

function getSupplierRegistrationType(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);
  const registeredByAdmin = firstString(supplier, ["registered_by_admin"], "false");

  return registeredByAdmin === "true" || registeredByAdmin === "1"
    ? "Registered by Admin"
    : "Self-Registered";
}

function isSupplierAccountActive(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);
  const active = firstString(supplier, ["user.is_active", "is_active"], "true");

  return active === "true" || active === "1";
}

function isKtpUploaded(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return Boolean(
    firstString(
      supplier,
      ["ktp_document_path", "ktp_document", "ktp_photo", "foto_ktp"],
      ""
    )
  );
}

function isNpwpUploaded(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return Boolean(
    firstString(
      supplier,
      ["npwp_document_path", "npwp_document", "npwp_photo", "foto_npwp"],
      ""
    )
  );
}

function getLandSource(bid: BidRecord | null) {
  const supplier = getSupplierSource(bid);

  return (
    asRecord(getNestedValue(supplier, "lands.0")) ??
    asRecord(getNestedValue(supplier, "lahan.0")) ??
    asRecord(getNestedValue(supplier, "farm")) ??
    asRecord(getNestedValue(supplier, "land")) ??
    null
  );
}

function getLandOwner(bid: BidRecord | null) {
  return firstString(getLandSource(bid), ["owner_name", "nama_pemilik"], getSupplierName(bid));
}

function getLandArea(bid: BidRecord | null) {
  const land = getLandSource(bid);
  const area = firstString(land, ["luas_lahan_m2", "area_m2", "luas_lahan"], "");

  return area ? `${formatNumber(firstNumber(land, ["luas_lahan_m2", "area_m2", "luas_lahan"], 0))} m²` : "-";
}

function getLandLocation(bid: BidRecord | null) {
  const land = getLandSource(bid);

  const district = firstString(land, ["kecamatan"], "");
  const city = firstString(land, ["kabupaten", "city"], "");
  const address = firstString(land, ["alamat", "alamat_lahan", "address"], "");

  const parts = [address, district, city].filter(Boolean);
  if (parts.length) return parts.join(", ");

  const supplier = getSupplierSource(bid);
  const supplierDistrict = firstString(supplier, ["kecamatan"], "");
  const supplierCity = firstString(supplier, ["kabupaten", "city"], "");

  return [supplierDistrict, supplierCity].filter(Boolean).join(", ") || "-";
}

function getLandStatus(bid: BidRecord | null) {
  const land = getLandSource(bid);

  return titleCase(firstString(land, ["status", "kepemilikan", "ownership"], "Tidak tersedia"));
}

function getBidStatus(bid: BidRecord | null) {
  return titleCase(firstString(bid, ["status", "data.status"], "submitted"));
}

function getBidNotes(bid: BidRecord | null) {
  return firstString(bid, ["notes", "catatan", "data.notes"], "");
}

function getBidSubmittedAt(bid: BidRecord | null) {
  return firstString(bid, ["submitted_at", "created_at", "data.submitted_at"], "-");
}

function getBidCreatedAt(bid: BidRecord | null) {
  return firstString(bid, ["created_at", "data.created_at"], "-");
}

function getBidUpdatedAt(bid: BidRecord | null) {
  return firstString(bid, ["updated_at", "data.updated_at"], "-");
}

function getBidRevisedAt(bid: BidRecord | null) {
  return firstString(bid, ["revised_at", "data.revised_at"], "");
}

function getBidWithdrawnAt(bid: BidRecord | null) {
  return firstString(bid, ["withdrawn_at", "data.withdrawn_at"], "");
}

function getBidItemId(item: SupplierBidItemRecord, index: number) {
  return firstString(item, ["id", "data.id"], `item-${index + 1}`);
}

function getBidItemBountyItemId(item: SupplierBidItemRecord) {
  return firstString(item, ["bounty_item_id", "bounty_item.id"], "");
}

function getBidItemName(
  item: SupplierBidItemRecord,
  index: number,
  bountyItems: BountyItemRecord[]
) {
  const direct = firstString(
    item,
    ["bounty_item.item_name", "bounty_item.name", "item_name", "name"],
    ""
  );

  if (direct) return direct;

  const bountyItemId = getBidItemBountyItemId(item);
  const matched = bountyItems.find((bountyItem, bountyIndex) => {
    const id = firstString(bountyItem, ["id", "bounty_item_id"], String(bountyIndex + 1));
    return String(id) === String(bountyItemId);
  });

  return matched
    ? firstString(matched, ["item_name", "name"], `Item ${index + 1}`)
    : `Item ${index + 1}`;
}

function getRequestedItem(
  item: SupplierBidItemRecord,
  bountyItems: BountyItemRecord[]
) {
  const embedded = asRecord(item.bounty_item);
  if (embedded) return embedded;

  const bountyItemId = getBidItemBountyItemId(item);

  return (
    bountyItems.find((bountyItem, index) => {
      const id = firstString(bountyItem, ["id", "bounty_item_id"], String(index + 1));
      return String(id) === String(bountyItemId);
    }) ?? null
  );
}

function getBidItemUnit(
  item: SupplierBidItemRecord,
  bountyItems: BountyItemRecord[]
) {
  return firstString(
    item,
    ["bounty_item.unit", "unit"],
    firstString(getRequestedItem(item, bountyItems), ["unit"], "unit")
  );
}

function getBidItemTargetQuantity(
  item: SupplierBidItemRecord,
  bountyItems: BountyItemRecord[]
) {
  return firstNumber(
    getRequestedItem(item, bountyItems),
    ["target_quantity", "quantity", "qty"],
    0
  );
}

function getBidItemQuantity(item: SupplierBidItemRecord) {
  return firstNumber(item, ["estimasi_kuantitas", "estimated_quantity", "quantity"], 0);
}

function getBidItemPrice(item: SupplierBidItemRecord) {
  return firstNumber(item, ["estimasi_harga", "estimated_price", "price"], 0);
}

function getBidItemGrade(item: SupplierBidItemRecord) {
  return firstString(item, ["grade"], "-");
}

function getBidItemNote(item: SupplierBidItemRecord) {
  return firstString(item, ["catatan", "notes"], "");
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

function getItemDeltaText(
  quantity: number,
  target: number,
  unit: string
) {
  if (!target) return "Target unavailable";
  if (quantity === target) return "Target Met";
  if (quantity > target) return `+${formatNumber(quantity - target)}${unit} above target`;

  return `-${formatNumber(target - quantity)}${unit} from target`;
}

function getTotalQuoteValue(items: SupplierBidItemRecord[]) {
  return items.reduce((total, item) => {
    return total + getBidItemQuantity(item) * getBidItemPrice(item);
  }, 0);
}

function findBidFromList(bids: AdminBidRecord[], bidId: string) {
  return bids.find((bid, index) => {
    const candidates = [
      firstString(bid, ["id"], ""),
      firstString(bid, ["bid_id"], ""),
      firstString(bid, ["data.id"], ""),
      `bid-${index + 1}`,
    ];

    return candidates.some((candidate) => String(candidate) === String(bidId));
  }) as BidRecord | undefined;
}

export default function AdminBountyBidDetailView({
  bountyId,
  bidId,
}: AdminBountyBidDetailViewProps) {
  const [bounty, setBounty] = useState<AdminBountyRecord | null>(null);
  const [bid, setBid] = useState<BidRecord | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bountyItems = useMemo(() => getBountyItems(bounty), [bounty]);
  const bidItems = useMemo(() => getBidItems(bid), [bid]);
  const totalQuoteValue = useMemo(() => getTotalQuoteValue(bidItems), [bidItems]);

  const supplierName = getSupplierName(bid);
  const supplierUsername = getSupplierUsername(bid);
  const bidStatus = getBidStatus(bid);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const bountyResponse = await getAdminBountyDetail(bountyId);
      let bidResponse: BidRecord | null = null;

      try {
        bidResponse = (await getAdminBountyBidDetail(bountyId, bidId)) as BidRecord;
      } catch {
        const bidsResponse = await getAdminBountyBids(bountyId);
        bidResponse = findBidFromList(bidsResponse, bidId) ?? null;
      }

      if (!bidResponse) {
        throw new Error("Detail bid tidak ditemukan dari endpoint admin.");
      }

      setBounty(bountyResponse);
      setBid(bidResponse);
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bid.";
      setBounty(null);
      setBid(null);
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
  }, [bountyId, bidId]);

  const handleRequestRevision = () => {
    toast.info("Action Request Revision akan disambungkan setelah endpoint review bid dikunci.");
  };

  const handleRejectBid = () => {
    toast.info("Action Reject Bid akan disambungkan setelah endpoint review bid dikunci.");
  };

  const handleApproveBid = () => {
    toast.info("Action Approve Bid akan disambungkan setelah endpoint review bid dikunci.");
  };

  const openItemApprovalModal = (
  item: SupplierBidItemRecord,
  index: number,
  status: AdminBidItemApprovalStatus
) => {
  setApprovalModal({
    item,
    index,
    status,
    catatan:
      status === "approved"
        ? "sudah dicek, kualitas bagus"
        : "Kuantitas tidak memenuhi target",
    proofPhoto: null,
  });
};

const closeItemApprovalModal = () => {
  if (isSubmittingApproval) return;
  setApprovalModal(null);
};

const updateApprovalModal = (patch: Partial<ApprovalModalState>) => {
  setApprovalModal((current) => (current ? { ...current, ...patch } : current));
};

const handleSubmitItemApproval = async () => {
  if (!approvalModal) return;

  const itemId = getBidItemId(approvalModal.item, approvalModal.index);

  if (!itemId || itemId.startsWith("item-")) {
    toast.error("ID item bid tidak valid dari response API.");
    return;
  }

  if (approvalModal.status === "rejected" && !approvalModal.catatan.trim()) {
    toast.error("Catatan wajib diisi untuk reject item.");
    return;
  }

  setIsSubmittingApproval(true);

  try {
    await approveAdminBountyBidItem(bountyId, bidId, itemId, {
      status: approvalModal.status,
      catatan: approvalModal.catatan,
      proof_photo: approvalModal.proofPhoto,
    });

    toast.success(
      approvalModal.status === "approved"
        ? "Item bid berhasil di-approved."
        : "Item bid berhasil di-reject."
    );

    setApprovalModal(null);
    await loadDetail("refresh");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memproses approval item.";
    toast.error(message);
  } finally {
    setIsSubmittingApproval(false);
  }
};

  return (
    <AdminShell
      title="Bid Detail Review"
      description="Review detail bid supplier dan informasi profil supplier."
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
      {isLoading ? null : errorMessage || !bid ? (
        <section className="rounded-xl border border-error/15 bg-error-container p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
            <div className="min-w-0">
              <p className="font-bold text-on-error-container">Detail bid gagal dibaca</p>
              <p className="mt-1 break-words text-sm text-on-error-container">
                {errorMessage || "Data bid tidak ditemukan."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
        <main className="mx-auto w-full max-w-screen-2xl space-y-8 pb-10">
          <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <Link href="/admin/bounties" className="hover:text-primary">
                  Bounties
                </Link>
                <span>/</span>
                <Link
                  href={`/admin/bounties/${encodeURIComponent(bountyId)}`}
                  className="hover:text-primary"
                >
                  Submitted Bids
                </Link>
                <span>/</span>
                <span className="text-primary">Bid Detail</span>
              </nav>

              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                Bid Detail Review
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
                  {bidStatus}
                </span>
                <span className="text-sm font-medium text-on-surface-variant">
                  Bid ID: <span className="font-bold text-on-surface">#{bidId}</span>
                </span>
                <span className="h-1 w-1 rounded-full bg-surface-container-highest" />
                <span className="text-sm font-medium text-on-surface-variant">
                  Supplier:{" "}
                  <span className="font-bold text-on-surface">
                    {supplierName}
                    {supplierUsername ? ` (@${supplierUsername})` : ""}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/bounties/${encodeURIComponent(bountyId)}`}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high"
              >
                Back to Bids
              </Link>

              <button
                type="button"
                onClick={handleRequestRevision}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
              >
                Request Revision
              </button>

              <button
                type="button"
                onClick={handleRejectBid}
                className="rounded-xl border border-error/20 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error-container/20"
              >
                Reject Bid
              </button>

              <button
                type="button"
                onClick={handleApproveBid}
                className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Approve Bid
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiPill
              icon={CheckCircle2}
              label="Bid Status"
              value={bidStatus}
              tone="default"
            />
            <KpiPill
              icon={ShieldCheck}
              label="Supplier Approval"
              value={getSupplierApprovalStatus(bid)}
              tone="primary"
            />
            <KpiPill
              icon={Eye}
              label="Survey Status"
              value={getSupplierSurveyStatus(bid)}
              tone="tertiary"
            />
            <KpiPill
              icon={Package2}
              label="Quoted Items"
              value={`${bidItems.length} Items`}
              tone="default"
            />
          </section>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-8">
              <SupplierProfileSummary bid={bid} />

              <QuotedItemsComparison
                items={bidItems}
                bountyItems={bountyItems}
                totalQuoteValue={totalQuoteValue}
                onOpenApproval={openItemApprovalModal}
              />

              <SourceLandInformation bid={bid} />
            </div>

            <aside className="col-span-12 space-y-8 lg:col-span-4">
              <DecisionNotesPanel
                note={decisionNote}
                onChangeNote={setDecisionNote}
                revisedAt={getBidRevisedAt(bid)}
                withdrawnAt={getBidWithdrawnAt(bid)}
              />

              <BidLifecyclePanel bid={bid} />

              <EliteSupplierBadge supplierName={supplierName} />
            </aside>
          </div>
        </main>
            {approvalModal ? (
            <BidItemApprovalModal
                modal={approvalModal}
                bountyItems={bountyItems}
                isSubmitting={isSubmittingApproval}
                onClose={closeItemApprovalModal}
                onChange={updateApprovalModal}
                onSubmit={handleSubmitItemApproval}
            />
            ) : null}
        </>
      )}
    </AdminShell>
  );
}

function KpiPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone: "default" | "primary" | "tertiary";
}) {
  const iconClass =
    tone === "primary"
      ? "bg-primary-container/20 text-primary"
      : tone === "tertiary"
        ? "bg-tertiary-container/10 text-tertiary"
        : "bg-surface-container-high text-on-surface-variant";

  const valueClass =
    tone === "tertiary" ? "text-tertiary" : "text-on-surface";

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <p className={`truncate text-lg font-bold ${valueClass}`}>{value}</p>
      </div>
    </article>
  );
}

function SupplierProfileSummary({ bid }: { bid: BidRecord }) {
  const accountActive = isSupplierAccountActive(bid);
  const ktpUploaded = isKtpUploaded(bid);
  const npwpUploaded = isNpwpUploaded(bid);

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row">
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Supplier Profile Summary
            </h2>
            <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface">
              Manual Check Required
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <ProfileField label="Full Name" value={getSupplierName(bid)} />
            <ProfileField
              label="Username"
              value={getSupplierUsername(bid) ? `@${getSupplierUsername(bid)}` : "-"}
              primary
            />
            <ProfileField label="Phone" value={getSupplierPhone(bid)} />
            <ProfileField
              label="Registration Type"
              value={getSupplierRegistrationType(bid)}
            />
            <div className="md:col-span-2">
              <ProfileField label="Address" value={getSupplierAddress(bid)} />
            </div>
            <ProfileField label="Date of Birth" value={getSupplierBirthInfo(bid)} />
          </div>
        </div>

        <div className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 md:w-72">
          <h3 className="border-b border-outline-variant/20 pb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Verification Status
          </h3>

          <ul className="mt-4 space-y-4">
            <VerificationRow label="Account Active" active={accountActive} />
            <VerificationRow label="KTP Uploaded" active={ktpUploaded} />
            <VerificationRow label="NPWP Status" active={npwpUploaded} missingText="MISSING" />
          </ul>

          {!npwpUploaded ? (
            <p className="mt-4 text-[10px] font-medium italic leading-tight text-tertiary">
              NPWP is not provided by the supplier at this stage.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProfileField({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className={primary ? "text-sm font-semibold text-primary" : "text-sm font-semibold text-on-surface"}>
        {value || "-"}
      </p>
    </div>
  );
}

function VerificationRow({
  label,
  active,
  missingText,
}: {
  label: string;
  active: boolean;
  missingText?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      {active ? (
        <CheckCircle2 className="h-4 w-4 text-primary" />
      ) : (
        <div className="flex items-center gap-1 text-tertiary">
          <span className="text-[10px] font-bold">{missingText || "NO"}</span>
          <AlertCircle className="h-4 w-4" />
        </div>
      )}
    </li>
  );
}

function QuotedItemsComparison({
  items,
  bountyItems,
  totalQuoteValue,
  onOpenApproval,
}: {
  items: SupplierBidItemRecord[];
  bountyItems: BountyItemRecord[];
  totalQuoteValue: number;
  onOpenApproval: (
    item: SupplierBidItemRecord,
    index: number,
    status: AdminBidItemApprovalStatus
  ) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Quoted Items Comparison
        </h2>
        <span className="text-sm font-medium text-on-surface-variant">
          Total Quote Value:{" "}
          <span className="font-bold text-on-surface">
            {formatCurrency(totalQuoteValue)}
          </span>
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No quoted items"
          description="Bid ini belum memiliki item penawaran."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <QuotedItemCard
              key={`${getBidItemId(item, index)}-${index}`}
              item={item}
              index={index}
              bountyItems={bountyItems}
              onOpenApproval={onOpenApproval}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function QuotedItemCard({
  item,
  index,
  bountyItems,
  onOpenApproval,
}: {
  item: SupplierBidItemRecord;
  index: number;
  bountyItems: BountyItemRecord[];
  onOpenApproval: (
    item: SupplierBidItemRecord,
    index: number,
    status: AdminBidItemApprovalStatus
  ) => void;
}) {
  const itemName = getBidItemName(item, index, bountyItems);
  const unit = getBidItemUnit(item, bountyItems);
  const quantity = getBidItemQuantity(item);
  const targetQuantity = getBidItemTargetQuantity(item, bountyItems);
  const price = getBidItemPrice(item);
  const grade = getBidItemGrade(item);
  const note = getBidItemNote(item);
  const reviewStatus = getBidItemReviewStatus(item);
  const reviewerNote = getBidItemReviewerNote(item);
  const proofUrl = getBidItemProofUrl(item);

  const targetText = targetQuantity
    ? `${formatNumber(quantity)} ${unit} of ${formatNumber(targetQuantity)} ${unit} Target`
    : `${formatNumber(quantity)} ${unit}`;

  const deltaText = getItemDeltaText(quantity, targetQuantity, unit);
  const targetMet = targetQuantity > 0 && quantity >= targetQuantity;

  const isApproved = reviewStatus === "approved";
  const isRejected = reviewStatus === "rejected";

  const statusClass = isApproved
    ? "bg-primary/10 text-primary border-primary/20"
    : isRejected
      ? "bg-error/10 text-error border-error/20"
      : "bg-surface-container-high text-on-surface-variant border-outline-variant/20";

  return (
    <article className="rounded-2xl border border-outline-variant/10 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-primary">
            <Package2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-bold text-on-surface">{itemName}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Grade {grade} Quality
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass}`}
        >
          {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
        </span>
      </div>

      <div className="mb-4 rounded-2xl bg-surface-container-low px-4 py-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-on-surface-variant">Quantity</span>
          <div className="text-right">
            <p className="font-bold text-on-surface">{targetText}</p>
            <p
              className={
                targetMet
                  ? "text-[10px] font-bold uppercase text-primary"
                  : "text-[10px] font-bold uppercase text-tertiary"
              }
            >
              {deltaText}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low px-4 py-3">
        <span className="text-sm text-on-surface-variant">Quoted Price</span>
        <span className="font-bold text-on-surface">
          {formatCurrency(price)}
          <span className="text-xs font-normal text-on-surface-variant">/{unit}</span>
        </span>
      </div>

      <div className="space-y-3 px-1">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Supplier Note
          </p>
          <p className="text-xs italic text-on-surface">
            "{note || "Tidak ada catatan supplier."}"
          </p>
        </div>

        {reviewerNote ? (
          <div className="rounded-xl bg-surface-container-low p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Reviewer Note
            </p>
            <p className="text-xs text-on-surface">{reviewerNote}</p>
          </div>
        ) : null}

        {proofUrl ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs font-semibold text-primary">
            Proof photo attached
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-outline-variant/10 pt-5">
        <button
          type="button"
          onClick={() => onOpenApproval(item, index, "rejected")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/20 px-4 py-2.5 text-sm font-bold text-error transition hover:bg-error-container/30"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>

        <button
          type="button"
          onClick={() => onOpenApproval(item, index, "approved")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </button>
      </div>
    </article>
  );
}

function SourceLandInformation({ bid }: { bid: BidRecord }) {
  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Source Land Information
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <ProfileField label="Land Owner" value={getLandOwner(bid)} />
        <ProfileField label="Total Area" value={getLandArea(bid)} />
        <ProfileField label="Land Location" value={getLandLocation(bid)} />
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Land Status
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-container" />
            <p className="text-sm font-bold text-on-surface">{getLandStatus(bid)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low">
        <div className="text-center">
          <MapPin className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-xs font-bold text-on-surface">Land map preview</p>
          <p className="mt-1 text-[11px] text-on-surface-variant">
            Map/image source belum tersedia dari response API.
          </p>
        </div>
      </div>
    </section>
  );
}

function DecisionNotesPanel({
  note,
  onChangeNote,
  revisedAt,
  withdrawnAt,
}: {
  note: string;
  onChangeNote: (value: string) => void;
  revisedAt: string;
  withdrawnAt: string;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="font-headline text-lg font-bold text-on-surface">
        Decision Notes
      </h2>

      <p className="mb-4 mt-2 text-xs leading-relaxed text-on-surface-variant">
        Provide a reason for approval, rejection, or revision request. This note
        can be sent to supplier when the action endpoint is connected.
      </p>

      <textarea
        value={note}
        onChange={(event) => onChangeNote(event.target.value)}
        className="mb-4 min-h-[160px] w-full resize-none rounded-2xl border-none bg-surface-container-low p-4 text-sm text-on-surface outline-none placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container/30"
        placeholder="Enter internal or feedback notes here..."
      />

      <div className="space-y-3">
        <InfoBox
          icon={Info}
          text={`Bid revision history: ${revisedAt ? formatDateTime(revisedAt) : "Not provided"}`}
          tone="secondary"
        />
        <InfoBox
          icon={AlertCircle}
          text={`Last withdrawn: ${withdrawnAt ? formatDateTime(withdrawnAt) : "Not provided"}`}
          tone="tertiary"
        />
      </div>
    </section>
  );
}

function InfoBox({
  icon: Icon,
  text,
  tone,
}: {
  icon: typeof Info;
  text: string;
  tone: "secondary" | "tertiary";
}) {
  return (
    <div
      className={
        tone === "secondary"
          ? "flex items-center gap-2 rounded-xl border border-secondary-container/30 bg-secondary-container/20 p-3"
          : "flex items-center gap-2 rounded-xl border border-tertiary-container/20 bg-tertiary-container/10 p-3"
      }
    >
      <Icon
        className={
          tone === "secondary"
            ? "h-4 w-4 shrink-0 text-secondary"
            : "h-4 w-4 shrink-0 text-tertiary"
        }
      />
      <p
        className={
          tone === "secondary"
            ? "text-[10px] font-medium leading-tight text-on-secondary-container"
            : "text-[10px] font-medium leading-tight text-tertiary"
        }
      >
        {text}
      </p>
    </div>
  );
}

function BidLifecyclePanel({ bid }: { bid: BidRecord }) {
  const revisedAt = getBidRevisedAt(bid);

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-white p-6 shadow-sm">
      <h2 className="mb-6 font-headline text-lg font-bold text-on-surface">
        Bid Lifecycle
      </h2>

      <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-surface-container-high before:content-['']">
        <LifecycleItem
          done
          title="Bid Created"
          time={formatDateTime(getBidCreatedAt(bid))}
        />
        <LifecycleItem
          done
          title="Bid Submitted"
          time={formatDateTime(getBidSubmittedAt(bid))}
        />
        <LifecycleItem
          done
          title="Last Updated"
          time={formatDateTime(getBidUpdatedAt(bid))}
        />
        <LifecycleItem title="Awaiting Decision" time="Next step: Admin Approval" />
      </div>

      <div className="mt-10 border-t border-outline-variant/10 pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Revision Status
          </p>
          <span className="text-[10px] font-semibold text-slate-400">
            {revisedAt ? "Available" : "None"}
          </span>
        </div>

        <p className="text-[11px] italic text-on-surface-variant">
          Revised at:{" "}
          <span className="not-italic font-medium text-slate-400">
            {revisedAt ? formatDateTime(revisedAt) : "Not provided"}
          </span>
        </p>
      </div>
    </section>
  );
}

function LifecycleItem({
  title,
  time,
  done = false,
}: {
  title: string;
  time: string;
  done?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-4 pl-8">
      <div
        className={
          done
            ? "absolute left-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-white ring-4 ring-white"
            : "absolute left-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant ring-4 ring-white"
        }
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
      </div>

      <div>
        <p className={done ? "text-xs font-bold uppercase tracking-wider text-on-surface" : "text-xs font-bold uppercase tracking-wider text-on-surface-variant"}>
          {title}
        </p>
        <p className={done ? "text-[10px] text-on-surface-variant" : "text-[10px] italic text-on-surface-variant"}>
          {time}
        </p>
      </div>
    </div>
  );
}

function EliteSupplierBadge({ supplierName }: { supplierName: string }) {
  return (
    <section className="rounded-2xl bg-primary p-6 text-center text-white shadow-lg shadow-primary/20">
      <ShieldCheck className="mx-auto mb-2 h-10 w-10" />
      <h2 className="font-headline text-lg font-bold leading-tight">
        Supplier Review Status
      </h2>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed opacity-90">
        {supplierName} sudah bisa direview berdasarkan data bid dan profil supplier
        yang diterima dari API.
      </p>
    </section>
  );
}

function BidItemApprovalModal({
  modal,
  bountyItems,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: {
  modal: ApprovalModalState;
  bountyItems: BountyItemRecord[];
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (patch: Partial<ApprovalModalState>) => void;
  onSubmit: () => void;
}) {
  const item = modal.item;
  const itemName = getBidItemName(item, modal.index, bountyItems);
  const unit = getBidItemUnit(item, bountyItems);
  const quantity = getBidItemQuantity(item);
  const price = getBidItemPrice(item);
  const grade = getBidItemGrade(item);
  const itemId = getBidItemId(item, modal.index);
  const isApproved = modal.status === "approved";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-background/20 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_24px_48px_-12px_rgba(25,28,30,0.20)]">
        <header className="px-8 pb-6 pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                Bid Item Approval
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Set approval status, add notes, and attach proof for this item.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low disabled:opacity-60"
              aria-label="Close approval modal"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="space-y-8 overflow-y-auto px-8 pb-8">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
                <Package2 className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Item ID: {itemId}
                  </span>
                  <span className="text-lg font-semibold text-on-surface">
                    {itemName}
                  </span>
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                  <span>{formatNumber(quantity)} {unit}</span>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <span className="font-medium text-on-surface">
                    {formatCurrency(price)}/{unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Grade {grade}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="px-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Approval Status
            </label>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onChange({ status: "approved" })}
                disabled={isSubmitting}
                className={
                  isApproved
                    ? "flex items-center justify-center gap-3 rounded-xl border-2 border-primary bg-primary-container/10 p-4 transition"
                    : "flex items-center justify-center gap-3 rounded-xl border-2 border-transparent bg-surface-container-low p-4 transition hover:border-primary/30"
                }
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-headline font-bold text-on-surface">
                  Approved
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ status: "rejected" })}
                disabled={isSubmitting}
                className={
                  !isApproved
                    ? "flex items-center justify-center gap-3 rounded-xl border-2 border-error bg-error-container/20 p-4 transition"
                    : "flex items-center justify-center gap-3 rounded-xl border-2 border-transparent bg-surface-container-low p-4 transition hover:border-error/30"
                }
              >
                <XCircle className="h-5 w-5 text-error" />
                <span className="font-headline font-bold text-on-surface">
                  Rejected
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="px-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Catatan
            </label>

            <textarea
              value={modal.catatan}
              onChange={(event) => onChange({ catatan: event.target.value })}
              rows={3}
              disabled={isSubmitting}
              placeholder="Masukkan catatan tambahan..."
              className="w-full resize-none rounded-xl border-none bg-surface-container-low p-4 text-on-surface outline-none transition placeholder:text-on-surface-variant focus:bg-surface-container focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
            />
          </div>

          <div className="space-y-3">
            <label className="px-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Proof Photo
            </label>

            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low p-8 transition-colors hover:bg-surface-container-high">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                disabled={isSubmitting}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onChange({ proofPhoto: file });
                }}
              />

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest transition-transform group-hover:scale-110">
                <UploadCloud className="h-8 w-8 text-secondary" />
              </div>

              <div className="text-center">
                <p className="font-headline font-bold text-on-surface">
                  {modal.proofPhoto
                    ? modal.proofPhoto.name
                    : "Click to upload harvest proof"}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            </label>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 bg-surface-container-low px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-6 py-2.5 font-headline font-bold text-secondary transition-colors hover:bg-surface-container-highest disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={
              isApproved
                ? "inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 font-headline font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                : "inline-flex items-center gap-2 rounded-xl bg-error px-8 py-2.5 font-headline font-bold text-white shadow-lg shadow-error/20 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            }
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isApproved ? "Approve Item" : "Reject Item"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
      <Package2 className="mx-auto h-8 w-8 text-on-surface-variant" />
      <p className="mt-3 text-sm font-bold text-on-surface">{title}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
    </div>
  );
}