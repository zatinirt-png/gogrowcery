"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Grid2X2,
  History,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Package2,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getMe, logout } from "@/features/auth/api";
import { clearAuthSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import {
  getSupplierBountyBid,
  getSupplierBountyDetail,
  submitSupplierBountyBid,
} from "@/features/bounty/api";
import type {
  SupplierBidItemPayload,
  SupplierBidItemRecord,
  SupplierBidPayload,
  SupplierBidRecord,
  SupplierBountyItem,
  SupplierBountyRecord,
} from "@/features/bounty/types";
import SupplierShell from "./supplier-shell";

type SupplierBountyDetailViewProps = {
  bountyId: string;
};

type DetailMode = "submit" | "submitted";

type BidFormItem = {
  bounty_item_id: string;
  item_name: string;
  requested_quantity: number;
  unit: string;
  request_note: string;
  grade: "A" | "B" | "C";
  estimasi_harga: string;
  estimasi_kuantitas: string;
  catatan: string;
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

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function getItemId(item: SupplierBountyItem, fallback: string) {
  return firstString(item, ["id", "bounty_item_id", "data.id"], fallback);
}

function getItemName(item: SupplierBountyItem, index: number) {
  return firstString(item, ["item_name", "name", "data.item_name"], `Item ${index + 1}`);
}

function getItemQuantity(item: SupplierBountyItem) {
  return parseNumber(
    item.target_quantity ??
      item.quantity ??
      item.qty ??
      getNestedValue(item, "data.target_quantity")
  );
}

function getItemUnit(item: SupplierBountyItem) {
  return firstString(item, ["unit", "data.unit"], "unit");
}

function getItemNote(item: SupplierBountyItem) {
  return firstString(item, ["notes", "description", "catatan", "data.notes"], "");
}

function getBountyCode(bounty: SupplierBountyRecord, fallbackId: string) {
  return firstString(
    bounty,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.code"],
    `BNT-${fallbackId}`
  );
}

function getBountyTitle(bounty: SupplierBountyRecord) {
  return firstString(bounty, ["title", "name", "data.title"], "Untitled Bounty");
}

function getBountyClient(bounty: SupplierBountyRecord) {
  return firstString(
    bounty,
    ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
    "Client tidak tersedia"
  );
}

function getBountyDescription(bounty: SupplierBountyRecord) {
  return firstString(
    bounty,
    ["description", "notes", "data.description"],
    "Tidak ada deskripsi bounty."
  );
}

function getBountyStatus(bounty: SupplierBountyRecord) {
  return titleCase(
    firstString(
      bounty,
      ["status", "publication_status", "approval_status", "data.status"],
      "published"
    )
  );
}

function getBountyDeadline(bounty: SupplierBountyRecord) {
  return firstString(
    bounty,
    [
      "deadline_at",
      "deadline",
      "deadlineAt",
      "extended_deadline_at",
      "new_deadline",
      "data.deadline_at",
    ],
    "-"
  );
}

function getBountyOriginalDeadline(bounty: SupplierBountyRecord) {
  return firstString(
    bounty,
    [
      "original_deadline_at",
      "previous_deadline_at",
      "old_deadline_at",
      "initial_deadline_at",
      "data.original_deadline_at",
    ],
    ""
  );
}

function getBountyCreatedAt(bounty: SupplierBountyRecord) {
  return firstString(bounty, ["created_at", "createdAt", "data.created_at"], "-");
}

function isDeadlineExtended(bounty: SupplierBountyRecord) {
  const current = getBountyDeadline(bounty);
  const original = getBountyOriginalDeadline(bounty);

  if (!current || !original || current === "-" || original === "-") return false;

  return formatDate(current) !== formatDate(original);
}

function getBidItems(bid: SupplierBidRecord | null) {
  if (!bid) return [];

  if (Array.isArray(bid.items)) return bid.items;
  if (Array.isArray(bid.bid_items)) return bid.bid_items;

  const dataItems = getNestedValue(bid, "data.items");
  if (Array.isArray(dataItems)) return dataItems as SupplierBidItemRecord[];

  const dataBidItems = getNestedValue(bid, "data.bid_items");
  if (Array.isArray(dataBidItems)) return dataBidItems as SupplierBidItemRecord[];

  return [];
}

function getBidItemBountyItemId(item: SupplierBidItemRecord) {
  return firstString(item, ["bounty_item_id", "bounty_item.id", "data.bounty_item_id"], "");
}

function getBidItemGrade(item: SupplierBidItemRecord | null) {
  return firstString(item, ["grade", "data.grade"], "A");
}

function getBidItemPrice(item: SupplierBidItemRecord | null) {
  if (!item) return 0;
  return parseNumber(item.estimasi_harga ?? item.estimated_price ?? item.price);
}

function getBidItemQuantity(item: SupplierBidItemRecord | null) {
  if (!item) return 0;
  return parseNumber(item.estimasi_kuantitas ?? item.estimated_quantity ?? item.quantity);
}

function getBidItemNote(item: SupplierBidItemRecord | null) {
  return firstString(item, ["catatan", "notes", "data.catatan", "data.notes"], "");
}

function getBidNotes(bid: SupplierBidRecord | null) {
  if (!bid) return "";

  return firstString(bid, ["notes", "data.notes"], "");
}

function getBidStatus(bid: SupplierBidRecord | null) {
  if (!bid) return "Submitted";

  return titleCase(firstString(bid, ["status", "data.status"], "submitted"));
}

function getBidSubmittedAt(bid: SupplierBidRecord | null) {
  if (!bid) return "-";

  return firstString(
    bid,
    ["submitted_at", "created_at", "updated_at", "data.submitted_at", "data.created_at"],
    "-"
  );
}

function findBidItemForBountyItem(
  bidItems: SupplierBidItemRecord[],
  bountyItem: SupplierBountyItem,
  fallbackId: string
) {
  const bountyItemId = getItemId(bountyItem, fallbackId);

  return (
    bidItems.find((bidItem) => String(getBidItemBountyItemId(bidItem)) === String(bountyItemId)) ??
    null
  );
}

function getEstimatedValueFromForm(items: BidFormItem[]) {
  return items.reduce((total, item) => {
    return total + parseNumber(item.estimasi_harga) * parseNumber(item.estimasi_kuantitas);
  }, 0);
}

function getEstimatedValueFromBid(bid: SupplierBidRecord | null) {
  return getBidItems(bid).reduce((total, item) => {
    return total + getBidItemPrice(item) * getBidItemQuantity(item);
  }, 0);
}

function getFulfillmentRateFromForm(items: BidFormItem[]) {
  const requested = items.reduce((total, item) => total + item.requested_quantity, 0);
  const proposed = items.reduce(
    (total, item) => total + parseNumber(item.estimasi_kuantitas),
    0
  );

  if (!requested) return 0;

  return Math.min(100, Math.round((proposed / requested) * 1000) / 10);
}

function getFulfillmentRateFromBid(
  bountyItems: SupplierBountyItem[],
  bid: SupplierBidRecord | null
) {
  const requested = bountyItems.reduce((total, item) => total + getItemQuantity(item), 0);
  const proposed = getBidItems(bid).reduce(
    (total, item) => total + getBidItemQuantity(item),
    0
  );

  if (!requested) return 0;

  return Math.min(100, Math.round((proposed / requested) * 1000) / 10);
}

function getCompleteness(items: BidFormItem[], notes: string) {
  const itemCount = Math.max(items.length, 1);

  const gradeFilled = items.every((item) => Boolean(item.grade));
  const qtyFilled = items.filter((item) => parseNumber(item.estimasi_kuantitas) > 0).length;
  const priceFilled = items.filter((item) => parseNumber(item.estimasi_harga) > 0).length;
  const optionalNotesFilled = items.filter((item) => item.catatan.trim()).length;
  const overallNotesFilled = Boolean(notes.trim());

  const score = Math.round(
    ((gradeFilled ? 1 : 0) +
      qtyFilled / itemCount +
      priceFilled / itemCount +
      optionalNotesFilled / itemCount +
      (overallNotesFilled ? 1 : 0)) *
      20
  );

  return {
    gradeFilled,
    qtyFilled: qtyFilled === items.length && items.length > 0,
    priceFilled: priceFilled === items.length && items.length > 0,
    optionalNotesFilled: optionalNotesFilled > 0,
    overallNotesFilled,
    score: Math.min(100, score),
  };
}

function resolveBidRecord(payload: unknown): SupplierBidRecord | null {
  const candidates = [
    payload,
    getNestedValue(payload, "bid"),
    getNestedValue(payload, "my_bid"),
    getNestedValue(payload, "supplier_bid"),
    getNestedValue(payload, "data"),
    getNestedValue(payload, "data.bid"),
    getNestedValue(payload, "data.my_bid"),
    getNestedValue(payload, "data.supplier_bid"),
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;

    const record = candidate as SupplierBidRecord;
    const bidItems = getBidItems(record);

    const hasBidIdentity =
      firstString(record, ["id", "bid_id", "data.id"], "") !== "" ||
      firstString(record, ["submitted_at", "created_at", "updated_at"], "") !== "" ||
      firstString(record, ["notes"], "") !== "" ||
      firstString(record, ["status"], "") !== "" ||
      bidItems.length > 0;

    if (hasBidIdentity) return record;
  }

  return null;
}

function isBidNotFoundError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 404;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("tidak ditemukan") ||
    message.includes("belum")
  );
}

function createInitialItems(
  bounty: SupplierBountyRecord,
  bid: SupplierBidRecord | null = null
): BidFormItem[] {
  const bidItems = getBidItems(bid);

  return getBountyItems(bounty).map((item, index) => {
    const fallbackId = String(index + 1);
    const bountyItemId = getItemId(item, fallbackId);
    const requestedQuantity = getItemQuantity(item);
    const bidItem = findBidItemForBountyItem(bidItems, item, fallbackId);

    return {
      bounty_item_id: bountyItemId,
      item_name: getItemName(item, index),
      requested_quantity: requestedQuantity,
      unit: getItemUnit(item),
      request_note: getItemNote(item),
      grade: (getBidItemGrade(bidItem) as BidFormItem["grade"]) || "A",
      estimasi_harga: bidItem ? String(getBidItemPrice(bidItem)) : "",
      estimasi_kuantitas: bidItem
        ? String(getBidItemQuantity(bidItem))
        : requestedQuantity > 0
          ? String(requestedQuantity)
          : "",
      catatan: getBidItemNote(bidItem),
    };
  });
}

function validateBid(items: BidFormItem[]) {
  if (!items.length) return "Bounty belum memiliki item yang bisa diajukan bid.";

  for (const item of items) {
    if (!item.bounty_item_id) return `${item.item_name} tidak memiliki bounty_item_id.`;
    if (!item.grade) return `Grade untuk ${item.item_name} wajib dipilih.`;

    if (parseNumber(item.estimasi_harga) <= 0) {
      return `Estimasi harga untuk ${item.item_name} wajib lebih dari 0.`;
    }

    if (parseNumber(item.estimasi_kuantitas) <= 0) {
      return `Estimasi kuantitas untuk ${item.item_name} wajib lebih dari 0.`;
    }
  }

  return null;
}

function buildBidPayload(items: BidFormItem[], notes: string): SupplierBidPayload {
  return {
    notes: notes.trim(),
    items: items.map((item) => ({
      bounty_item_id: item.bounty_item_id,
      grade: item.grade,
      estimasi_harga: parseNumber(item.estimasi_harga),
      estimasi_kuantitas: parseNumber(item.estimasi_kuantitas),
      ...(item.catatan.trim() ? { catatan: item.catatan.trim() } : {}),
    })),
  };
}

function createLocalBid(
  bountyId: string,
  payload: SupplierBidPayload,
  fallbackCreatedAt = new Date().toISOString()
): SupplierBidRecord {
  return {
    id: `local-${bountyId}`,
    bounty_id: bountyId,
    status: "submitted",
    notes: payload.notes,
    submitted_at: fallbackCreatedAt,
    created_at: fallbackCreatedAt,
    items: payload.items.map((item, index) => ({
      id: `local-${bountyId}-${index}`,
      bounty_item_id: item.bounty_item_id,
      grade: item.grade,
      estimasi_harga: item.estimasi_harga,
      estimasi_kuantitas: item.estimasi_kuantitas,
      catatan: item.catatan,
    })),
  };
}

export default function SupplierBountyDetailView({
  bountyId,
}: SupplierBountyDetailViewProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bounty, setBounty] = useState<SupplierBountyRecord | null>(null);
  const [bid, setBid] = useState<SupplierBidRecord | null>(null);
  const [items, setItems] = useState<BidFormItem[]>([]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<DetailMode>("submit");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedLocally, setIsSubmittedLocally] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadDetail = async (modeType: "initial" | "refresh" = "refresh") => {
    if (modeType === "initial") setIsLoadingDetail(true);
    else setIsRefreshing(true);

    try {
      const bountyResponse = await getSupplierBountyDetail(bountyId);
      let bidResponse: SupplierBidRecord | null = null;

      try {
        const rawBid = await getSupplierBountyBid(bountyId);
        bidResponse = resolveBidRecord(rawBid);
      } catch (error) {
        if (!isBidNotFoundError(error)) throw error;
      }

      setBounty(bountyResponse);
      setBid(bidResponse);
      setItems(createInitialItems(bountyResponse, bidResponse));
      setNotes(getBidNotes(bidResponse));
      setMode(bidResponse ? "submitted" : "submit");
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat detail bounty.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (modeType === "initial") setIsLoadingDetail(false);
      else setIsRefreshing(false);
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
        await loadDetail("initial");
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bountyId, router]);

  const bountyItems = useMemo(() => {
    return bounty ? getBountyItems(bounty) : [];
  }, [bounty]);

  const formSummary = useMemo(() => {
    return {
      totalItems: items.length,
      fulfillmentRate: getFulfillmentRateFromForm(items),
      estimatedValue: getEstimatedValueFromForm(items),
    };
  }, [items]);

  const bidSummary = useMemo(() => {
    return {
      totalItems: getBidItems(bid).length,
      fulfillmentRate: getFulfillmentRateFromBid(bountyItems, bid),
      estimatedValue: getEstimatedValueFromBid(bid),
    };
  }, [bid, bountyItems]);

  const completeness = useMemo(() => {
    return getCompleteness(items, notes);
  }, [items, notes]);

  const updateItem = (index: number, patch: Partial<BidFormItem>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!bounty) return;

    const validationError = validateBid(items);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = buildBidPayload(items, notes);

    setIsSubmitting(true);

    try {
      const response = await submitSupplierBountyBid(bountyId, payload);
      const resolvedBid = resolveBidRecord(response) ?? createLocalBid(bountyId, payload);

      setBid(resolvedBid);
      setItems(createInitialItems(bounty, resolvedBid));
      setNotes(getBidNotes(resolvedBid));
      setMode("submitted");
      setIsSubmittedLocally(true);

      toast.success(bid ? "Revisi bid berhasil dikirim." : "Bid berhasil dikirim.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim bid.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBid = () => {
    if (!bounty) return;

    setItems(createInitialItems(bounty, bid));
    setNotes(getBidNotes(bid));
    setMode("submit");
  };

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

  const isLoading = isLoadingUser || isLoadingDetail;

  return (
    <SupplierShell
      title="The Precision Harvest"
      description="Supplier bounty detail dan bid proposal workspace."
      actions={
        <button
          type="button"
          onClick={() => loadDetail("refresh")}
          disabled={isRefreshing || isLoadingDetail}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-70 sm:w-auto"
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
      {isLoading ? null : errorMessage || !bounty ? (
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
        <main className="mx-auto w-full max-w-6xl pb-10">
          {isSubmittedLocally ? (
            <BidSubmittedSuccessNotice
              bountyCode={getBountyCode(bounty, bountyId)}
              bountyTitle={getBountyTitle(bounty)}
              requester={getBountyClient(bounty)}
              totalItems={bidSummary.totalItems || formSummary.totalItems}
              estimatedValue={bidSummary.estimatedValue || formSummary.estimatedValue}
              fulfillmentRate={bidSummary.fulfillmentRate || formSummary.fulfillmentRate}
              onClose={() => setIsSubmittedLocally(false)}
            />
          ) : null}

          {mode === "submitted" && bid ? (
            <SubmittedBidView
              bounty={bounty}
              bid={bid}
              bountyId={bountyId}
              summary={bidSummary}
              onEdit={handleEditBid}
            />
          ) : (
            <SubmitBidView
              bounty={bounty}
              bountyId={bountyId}
              items={items}
              notes={notes}
              summary={formSummary}
              completeness={completeness}
              isRevision={Boolean(bid)}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onChangeItem={updateItem}
              onChangeNotes={setNotes}
              onCancel={() => {
                if (bid) {
                  setMode("submitted");
                  setItems(createInitialItems(bounty, bid));
                  setNotes(getBidNotes(bid));
                } else {
                  router.push("/supplier/bounties");
                }
              }}
            />
          )}
        </main>
      )}
    </SupplierShell>
  );
}

function SubmittedBidView({
  bounty,
  bid,
  bountyId,
  summary,
  onEdit,
}: {
  bounty: SupplierBountyRecord;
  bid: SupplierBidRecord;
  bountyId: string;
  summary: {
    totalItems: number;
    fulfillmentRate: number;
    estimatedValue: number;
  };
  onEdit: () => void;
}) {
  const bidItems = getBidItems(bid);
  const submittedAt = getBidSubmittedAt(bid);
  const deadline = getBountyDeadline(bounty);
  const originalDeadline = getBountyOriginalDeadline(bounty);
  const extended = isDeadlineExtended(bounty);

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface-variant">
        <Link href="/supplier/bounties" className="hover:text-primary">
          My Bids
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-on-surface">Bid Overview</span>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8 lg:col-span-2">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-surface-container-highest px-3 py-1 font-headline text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                {getBountyCode(bounty, bountyId)}
              </span>

              <span className="flex items-center gap-1.5 rounded-full bg-primary-container/20 px-3 py-1 font-headline text-xs font-bold uppercase text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {getBountyStatus(bounty)}
              </span>

              <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 font-headline text-xs font-bold uppercase text-blue-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {getBidStatus(bid)}
              </span>
            </div>

            <h1 className="mb-2 font-headline text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">
              {getBountyTitle(bounty)}
            </h1>

            <p className="text-lg text-on-surface-variant">
              Client:{" "}
              <span className="font-bold text-on-surface">
                {getBountyClient(bounty)}
              </span>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 md:gap-10">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                Response Deadline {extended ? "(Extended)" : ""}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Clock3 className="h-4 w-4 text-orange-600" />
                <span className="font-headline font-bold text-orange-900">
                  {formatDate(deadline)}
                </span>

                {extended && originalDeadline ? (
                  <span className="ml-1 text-xs text-orange-600 line-through">
                    {formatDate(originalDeadline)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Procurement Tier
              </p>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-headline font-bold text-on-surface">Standard</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 text-center shadow-sm">
          <div className="relative z-10 w-full">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
              Bid Submitted
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
              Proposal kamu sudah terkirim dan menunggu review dari client.
            </p>

            <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3 text-sm">
              <span className="font-medium text-on-surface-variant">Submitted on</span>
              <span className="text-right font-bold text-on-surface">
                {formatDateTime(submittedAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <h2 className="mb-6 flex items-center gap-3 font-headline text-xl font-bold">
              <span className="h-1 w-8 rounded-full bg-primary" />
              Bounty Overview
            </h2>

            <p className="leading-7 text-on-surface-variant">
              {getBountyDescription(bounty)}
            </p>
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant/10 p-6 pb-4 md:p-8 md:pb-4">
              <h2 className="flex items-center gap-3 font-headline text-xl font-bold">
                <span className="h-1 w-8 rounded-full bg-primary" />
                Requested Items vs. My Bid
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Item
                    </th>
                    <th className="bg-slate-50 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Client Request
                    </th>
                    <th className="bg-green-50 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-primary">
                      My Proposal
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/10">
                  {getBountyItems(bounty).map((item, index) => {
                    const fallbackId = String(index + 1);
                    const bidItem = findBidItemForBountyItem(bidItems, item, fallbackId);
                    const unit = getItemUnit(item);
                    const requestNote = getItemNote(item);
                    const bidNote = getBidItemNote(bidItem);

                    return (
                      <tr
                        key={`${getItemId(item, fallbackId)}-${index}`}
                        className="transition hover:bg-surface-container-low"
                      >
                        <td className="px-6 py-5">
                          <p className="font-headline font-bold text-on-surface">
                            {getItemName(item, index)}
                          </p>
                        </td>

                        <td className="bg-slate-50/50 px-6 py-5">
                          <p className="font-bold text-on-surface">
                            {getItemQuantity(item)} {unit}
                          </p>

                          {requestNote ? (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Note: {requestNote}
                            </p>
                          ) : null}
                        </td>

                        <td className="bg-green-50/30 px-6 py-5">
                          {bidItem ? (
                            <div className="space-y-1">
                              <p className="font-bold text-green-800">
                                {getBidItemQuantity(bidItem)} {unit}
                              </p>

                              <p className="text-xs font-medium text-green-700">
                                Grade {getBidItemGrade(bidItem)} •{" "}
                                {formatCurrency(getBidItemPrice(bidItem))}/{unit}
                              </p>

                              {bidNote ? (
                                <p className="text-[11px] italic text-green-600">
                                  "{bidNote}"
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-on-surface-variant">
                              Tidak diajukan
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <h2 className="mb-4 flex items-center gap-3 font-headline text-lg font-bold">
              <Edit3 className="h-5 w-5 text-primary" />
              My Proposal Notes
            </h2>

            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm italic text-green-900">
              "{getBidNotes(bid) || "Tidak ada catatan proposal."}"
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <section className="space-y-3 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <button
              type="button"
              onClick={() => toast.info("History bid akan ditampilkan setelah endpoint history tersedia.")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface px-4 py-3 font-headline text-sm font-bold text-primary transition hover:bg-primary/5"
            >
              <History className="h-4 w-4" />
              View Bid History
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-headline text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary/90"
            >
              <Edit3 className="h-4 w-4" />
              Edit Bid
            </button>

            <Link
              href="/supplier/bounties"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-headline text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bounties
            </Link>
          </section>

          <BidSummaryCard summary={summary} />

          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Bid Timeline
            </h3>

            <div className="relative space-y-6 pl-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-outline-variant/30">
              {extended ? (
                <TimelineItem
                  title="Deadline Extended"
                  time={formatDateTime(deadline)}
                  tone="orange"
                />
              ) : null}

              <TimelineItem
                title="Bid Submitted"
                time={formatDateTime(submittedAt)}
                tone="green"
              />

              <TimelineItem
                title="Bounty Published"
                time={formatDateTime(getBountyCreatedAt(bounty))}
                tone="slate"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl bg-surface-container-low/50 p-6">
            <SummaryLine label="Bounty ID" value={getBountyCode(bounty, bountyId)} />
            <SummaryLine label="Contract Type" value="Standard B2B" />
            <SummaryLine label="Visibility" value="Public" />
          </section>
        </aside>
      </section>
    </div>
  );
}

function SubmitBidView({
  bounty,
  bountyId,
  items,
  notes,
  summary,
  completeness,
  isRevision,
  isSubmitting,
  onSubmit,
  onCancel,
  onChangeItem,
  onChangeNotes,
}: {
  bounty: SupplierBountyRecord;
  bountyId: string;
  items: BidFormItem[];
  notes: string;
  summary: {
    totalItems: number;
    fulfillmentRate: number;
    estimatedValue: number;
  };
  completeness: ReturnType<typeof getCompleteness>;
  isRevision: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChangeItem: (index: number, patch: Partial<BidFormItem>) => void;
  onChangeNotes: (notes: string) => void;
}) {
  return (
    <>
      <nav className="mb-4 flex items-center gap-2 text-sm text-secondary">
        <Link href="/supplier/bounties" className="hover:text-primary">
          Bids
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-on-surface-variant">
          New Quote Request #{getBountyCode(bounty, bountyId)}
        </span>
      </nav>

      <Link
        href="/supplier/bounties"
        className="mb-8 inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface shadow-sm transition hover:bg-surface-container-low"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bounties
      </Link>

      <header className="mb-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-container px-3 py-1 font-mono text-xs font-bold text-primary">
                {getBountyCode(bounty, bountyId)}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                {getBountyStatus(bounty)}
              </span>
              {isRevision ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-800">
                  Revision Mode
                </span>
              ) : null}
            </div>

            <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              {isRevision ? "Edit Bid" : "Submit New Bid"}
            </h1>

            <p className="max-w-xl text-secondary">
              Curate your proposal with precision. Define grades, quantities,
              and competitive pricing for the requested produce items.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-surface-container-high px-6 py-3 font-semibold text-secondary transition hover:bg-surface-container-highest disabled:opacity-60"
            >
              Cancel & Return
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/10 transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isRevision ? "Submit Revision" : "Submit New Bid"}
            </button>
          </div>
        </div>
      </header>

      <section className="mb-8 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryBlock label="Bounty Title" value={getBountyTitle(bounty)} />
          <SummaryBlock label="Requester" value={getBountyClient(bounty)} />
          <SummaryBlock label="Deadline" value={formatDate(getBountyDeadline(bounty))} />
        </div>

        <div className="mt-5 border-t border-outline-variant/15 pt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Bounty Overview
          </p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            {getBountyDescription(bounty)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-12">
        <div className="space-y-10 xl:col-span-8">
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Quoted Items
              </h2>

              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary">
                {items.length} Items Selected
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 text-center shadow-sm">
                <Package2 className="mx-auto h-9 w-9 text-on-surface-variant" />
                <p className="mt-4 font-bold text-on-surface">Tidak ada item bounty</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Bounty ini belum memiliki item yang bisa diajukan bid.
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <article
                  key={`${item.bounty_item_id}-${index}`}
                  className="rounded-xl bg-surface-container-lowest p-6 shadow-sm transition hover:shadow-md md:p-8"
                >
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
                        <Leaf className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-secondary">
                          Item ID #{item.bounty_item_id}
                        </p>

                        <h3 className="font-headline text-xl font-bold text-on-surface">
                          {item.item_name}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                          Request: {item.requested_quantity} {item.unit}
                          {item.request_note ? ` • ${item.request_note}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1.5">
                      <span
                        className={
                          item.grade === "A"
                            ? "h-2 w-2 rounded-full bg-primary"
                            : "h-2 w-2 rounded-full bg-tertiary"
                        }
                      />
                      <span className="text-xs font-bold text-on-surface-variant">
                        Grade {item.grade}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Field label="Grade Level">
                      <select
                        value={item.grade}
                        onChange={(event) =>
                          onChangeItem(index, {
                            grade: event.target.value as BidFormItem["grade"],
                          })
                        }
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                      >
                        <option value="A">Grade A (Premium)</option>
                        <option value="B">Grade B (Standard)</option>
                        <option value="C">Grade C (Value)</option>
                      </select>
                    </Field>

                    <Field label={`Proposed Price (per ${item.unit})`}>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-secondary">
                          Rp
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.estimasi_harga}
                          onChange={(event) =>
                            onChangeItem(index, { estimasi_harga: event.target.value })
                          }
                          className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-11 pr-4 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                          placeholder="15000"
                        />
                      </div>
                    </Field>

                    <Field label={`Available Quantity (${item.unit})`}>
                      <input
                        type="number"
                        min="0"
                        value={item.estimasi_kuantitas}
                        onChange={(event) =>
                          onChangeItem(index, {
                            estimasi_kuantitas: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                        placeholder="45"
                      />
                    </Field>

                    <Field label="Item Specific Note">
                      <input
                        type="text"
                        value={item.catatan}
                        onChange={(event) =>
                          onChangeItem(index, { catatan: event.target.value })
                        }
                        className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
                        placeholder="e.g. Panen minggu ini"
                      />
                    </Field>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 md:p-8">
            <h2 className="mb-6 flex items-center gap-3 font-headline text-lg font-bold text-on-surface">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Overall Proposal Notes
            </h2>

            <textarea
              value={notes}
              onChange={(event) => onChangeNotes(event.target.value)}
              className="min-h-32 w-full resize-none rounded-xl border-none bg-surface-container-lowest p-5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed-dim"
              rows={4}
              placeholder="Tulis catatan umum untuk proposal ini..."
            />
          </section>
        </div>

        <aside className="space-y-8 xl:col-span-4">
          <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-lg shadow-secondary/5">
            <div className="relative h-32 bg-surface-container">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-container/20 to-transparent" />

              <div className="absolute bottom-4 left-6 right-6">
                <span className="mb-1 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-white">
                  Active Bounty
                </span>

                <p className="truncate font-headline font-extrabold tracking-tight text-on-surface">
                  {getBountyTitle(bounty)}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <SummaryLine label="Requester" value={getBountyClient(bounty)} />
              <SummaryLine
                label="Fulfillment Date"
                value={formatDate(getBountyDeadline(bounty))}
              />
              <SummaryLine
                label="Bounty Value"
                value={`${formatCurrency(summary.estimatedValue)} (Est)`}
                strong
              />
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 md:p-8">
            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-secondary">
              Quote Completeness
            </h3>

            <ul className="space-y-4">
              <ChecklistItem checked={completeness.gradeFilled} label="Grade Selection" />
              <ChecklistItem checked={completeness.qtyFilled} label="Estimated Quantity" />
              <ChecklistItem checked={completeness.priceFilled} label="Estimated Price" />
              <ChecklistItem
                checked={completeness.optionalNotesFilled}
                label="Optional Item Notes"
                optional
              />
              <ChecklistItem
                checked={completeness.overallNotesFilled}
                label="Overall Proposal Notes"
              />
            </ul>

            <div className="mt-8 border-t border-outline-variant/20 pt-8">
              <p className="mb-4 text-xs leading-relaxed text-secondary">
                Bid kamu{" "}
                <span className="font-bold text-on-surface">
                  {completeness.score}% complete
                </span>
                . Catatan tambahan membantu admin membaca kualitas proposal.
              </p>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
            </div>
          </section>

          <BidSummaryCard summary={summary} />

          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isRevision ? "Submit Revision" : "Submit New Bid"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl px-6 py-3 text-center font-semibold text-secondary transition hover:bg-surface-container disabled:opacity-60"
            >
              Cancel & Return
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}

function BidSubmittedSuccessNotice({
  bountyCode,
  bountyTitle,
  requester,
  totalItems,
  estimatedValue,
  fulfillmentRate,
  onClose,
}: {
  bountyCode: string;
  bountyTitle: string;
  requester: string;
  totalItems: number;
  estimatedValue: number;
  fulfillmentRate: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-surface p-5 shadow-2xl md:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-primary-container/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container shadow-xl shadow-primary/20">
              <Check className="h-10 w-10 text-white" />
            </div>

            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Bid Submitted Successfully
            </h2>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-secondary md:text-lg">
              Proposal kamu sudah terkirim ke tim procurement GoGrowcery dan masuk ke tahap review.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-5 shadow-sm md:col-span-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-secondary">
                    Current Status
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-headline text-xl font-bold text-primary">
                      Waiting for Survey
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant">
                  <Clock3 className="h-4 w-4" />
                  Est. 48 hours
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <Tag className="mb-4 h-5 w-5 text-primary" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Bounty Code
              </p>
              <p className="break-words font-headline text-lg font-bold text-on-surface">
                {bountyCode}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <ReceiptText className="mb-4 h-5 w-5 text-primary" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Total Items
              </p>
              <p className="font-headline text-lg font-bold text-on-surface">
                {totalItems} Items
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <Package2 className="mb-4 h-5 w-5 text-primary" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Est. Value
              </p>
              <p className="font-headline text-lg font-bold text-primary">
                {formatCurrency(estimatedValue)}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-on-surface p-6 text-white md:col-span-3">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.35),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(0,110,47,0.55),transparent_38%)]" />

              <div className="relative z-10">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  GoGrowcery Procurement Review
                </div>

                <h3 className="font-headline text-2xl font-bold">{bountyTitle}</h3>

                <p className="mt-2 text-sm text-white/70">
                  Requester: <span className="font-bold text-white">{requester}</span>
                </p>

                <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/70">Fulfillment Rate</span>
                    <span className="font-headline text-lg font-bold text-white">
                      {fulfillmentRate}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-primary-container"
                      style={{ width: `${Math.min(100, fulfillmentRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] hover:bg-primary/90 sm:w-auto"
            >
              <span>View My Bid</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <Link
              href="/supplier/bounties"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-surface-container-high px-8 py-4 font-headline text-lg font-bold text-on-surface transition hover:bg-surface-container-highest sm:w-auto"
            >
              <Grid2X2 className="h-5 w-5" />
              <span>Back to Bounties</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/20 pt-6 text-secondary md:flex-row">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-xs">Bukti submit tersimpan di sistem GoGrowcery.</span>
            </div>

            <div className="flex gap-6">
              <button
                type="button"
                className="text-xs underline decoration-primary/30 transition hover:text-primary"
                onClick={() =>
                  toast.info("Fitur download receipt bisa dibuat setelah endpoint receipt tersedia.")
                }
              >
                Download PDF Receipt
              </button>

              <button
                type="button"
                className="text-xs underline decoration-primary/30 transition hover:text-primary"
                onClick={() => toast.info("Silakan hubungi admin GoGrowcery untuk support bid.")}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BidSummaryCard({
  summary,
}: {
  summary: {
    totalItems: number;
    fulfillmentRate: number;
    estimatedValue: number;
  };
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
      <div className="p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Bid Summary
        </h3>

        <div className="space-y-4">
          <SummaryLine label="Total Items Proposed" value={String(summary.totalItems)} />
          <SummaryLine label="Fulfillment Rate" value={`${summary.fulfillmentRate}%`} />
          <SummaryLine
            label="Estimated Value"
            value={formatCurrency(summary.estimatedValue)}
            strong
          />
        </div>
      </div>
    </section>
  );
}

function TimelineItem({
  title,
  time,
  tone,
}: {
  title: string;
  time: string;
  tone: "green" | "orange" | "slate";
}) {
  const dotClass =
    tone === "green"
      ? "bg-primary ring-primary/20"
      : tone === "orange"
        ? "bg-orange-400 ring-orange-100"
        : "bg-slate-300 ring-slate-100";

  return (
    <div className="relative">
      <div
        className={`absolute -left-[29px] mt-1 h-[10px] w-[10px] rounded-full border-2 border-white ring-2 ${dotClass}`}
      />
      <p className="text-xs font-bold text-on-surface">{title}</p>
      <p className="mt-0.5 text-[10px] text-on-surface-variant">{time}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="ml-1 block text-xs font-bold text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 break-words font-headline text-sm font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 py-2 last:border-b-0">
      <span className="text-sm font-medium text-secondary">{label}</span>
      <span
        className={
          strong
            ? "text-right font-bold text-primary"
            : "text-right font-bold text-on-surface"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ChecklistItem({
  checked,
  label,
  optional = false,
}: {
  checked: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <div
        className={
          checked
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
            : "flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-secondary"
        }
      >
        {checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : optional ? (
          <span className="h-0.5 w-2 rounded bg-current" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
      </div>

      <span
        className={
          checked
            ? "text-sm font-medium text-on-surface"
            : "text-sm font-medium text-secondary"
        }
      >
        {label}
      </span>
    </li>
  );
}