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
  Eye,
  Gavel,
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

type AdminBidRecord = SupplierBidRecord & {
  supplier_id?: number | string | null;
  supplierId?: number | string | null;
  supplier_name?: string | null;
  supplier?: {
    id?: number | string;
    name?: string | null;
    business_name?: string | null;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    [key: string]: unknown;
  } | null;
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

function getBidItems(bid: AdminBidRecord) {
  if (Array.isArray(bid.items)) return bid.items;
  if (Array.isArray(bid.bid_items)) return bid.bid_items;

  const dataItems = getNestedValue(bid, "data.items");
  if (Array.isArray(dataItems)) return dataItems as SupplierBidItemRecord[];

  const dataBidItems = getNestedValue(bid, "data.bid_items");
  if (Array.isArray(dataBidItems)) return dataBidItems as SupplierBidItemRecord[];

  return [];
}

function getBidSupplierName(bid: AdminBidRecord) {
  return firstString(
    bid,
    [
      "supplier.name",
      "supplier.business_name",
      "supplier.company_name",
      "supplier_name",
      "data.supplier.name",
      "data.supplier.business_name",
      "data.supplier.company_name",
    ],
    "Supplier"
  );
}

function getBidStatus(bid: AdminBidRecord) {
  return titleCase(firstString(bid, ["status", "data.status"], "submitted"));
}

function getBidSubmittedAt(bid: AdminBidRecord) {
  return firstString(
    bid,
    ["submitted_at", "created_at", "updated_at", "data.submitted_at", "data.created_at"],
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

      let nextBids: AdminBidRecord[] = [];
      let nextBidError: string | null = null;

      if (!nextIsDraft) {
        try {
          const bidsResponse = await getAdminBountyBids(bountyId);
          nextBids = bidsResponse as AdminBidRecord[];
        } catch (error) {
          nextBids = [];
          nextBidError =
            error instanceof Error ? error.message : "Gagal memuat data bid.";
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
}: {
  detail: BountyDetailModel;
  statusMeta: ReturnType<typeof getStatusMeta>;
  biddingSummary: BiddingSummary | null;
  itemProgress: ItemProgress[];
  bids: AdminBidRecord[];
  bidErrorMessage: string | null;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 pb-10">
      <section className="flex items-center gap-2 text-sm font-medium text-secondary">
        <Link
          href="/admin/bounties"
          className="inline-flex items-center gap-1 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bounties
        </Link>
        <span>/</span>
        <span className="text-on-surface-variant">{detail.code}</span>
      </section>

      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`} />
              {statusMeta.label}
            </span>
            <span className="text-sm text-secondary">ID: {detail.code}</span>
          </div>

          <h1 className="break-words font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {detail.title}
          </h1>

          <p className="mt-2 max-w-2xl break-words text-base text-on-surface-variant">
            {detail.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/bounties/${encodeURIComponent(detail.id)}?mode=edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => toast.info("Popup update status bisa dibuat di tahap berikutnya.")}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            <RefreshCw className="h-4 w-4" />
            Update Status
          </button>

          <button
            type="button"
            onClick={() => toast.info("Panel manage bids bisa dibuat menjadi popup/route terpisah.")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary/90"
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

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={Users} label="Total Bidders" value={String(biddingSummary?.totalBidders ?? 0)} />
        <KpiCard icon={ClipboardList} label="Requested Items" value={String(detail.items.length)} />
        <KpiCard icon={CalendarDays} label="Deadline" value={formatDate(detail.deadlineAt)} />
        <KpiCard
          icon={CheckCircle2}
          label="Overall Fulfillment"
          value={`${biddingSummary?.fulfillment ?? 0}%`}
          subvalue="Est."
          emphasis="primary"
        />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <PublishedItemProgressCard itemProgress={itemProgress} />
          <SubmittedBidsCard bids={bids} />
        </div>

        <aside className="space-y-8">
          <ClientDetailsCard clientName={detail.clientName} />
          <AuditLogCard detail={detail} bidsCount={bids.length} />
        </aside>
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

function SubmittedBidsCard({ bids }: { bids: AdminBidRecord[] }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0_2px_12px_rgba(25,28,30,0.03)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Submitted Bids
        </h2>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {bids.length} Bids
        </span>
      </div>

      {bids.length === 0 ? (
        <EmptyState
          icon={Hourglass}
          title="No submitted bids"
          description="Belum ada supplier yang mengajukan bid."
        />
      ) : (
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <article
              key={`${firstString(bid, ["id", "data.id"], "bid")}-${index}`}
              className="rounded-xl border border-outline-variant/15 bg-surface p-4"
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="font-headline text-sm font-bold text-on-surface">
                    {getBidSupplierName(bid)}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {getBidStatus(bid)} • {formatDateTime(getBidSubmittedAt(bid))}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Estimated Value</p>
                  <p className="font-headline text-sm font-bold text-primary">
                    {formatCurrency(getBidEstimatedValue(bid))}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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