"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Edit,
  FileText,
  Info,
  ListChecks,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  TrendingUp,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import {
  extendBountyDeadline,
  getAdminBountyDetail,
  updateBounty,
  updateBountyStatus,
} from "@/features/bounty/api";
import type { AdminBountyRecord, BountyItemRecord } from "@/features/bounty/types";
import {
  createBountySchema,
  type CreateBountyFormValues,
} from "@/features/bounty/schema";
import { formatDateTimeLocalToApi } from "@/features/bounty/utils";

type AdminBountyDetailViewProps = {
  bountyId: string;
};

type BountyStatusOption = "draft" | "published" | "closed" | "cancelled";

const statusOptions: Array<{
  value: BountyStatusOption;
  label: string;
  phase: string;
  helper: string;
}> = [
  {
    value: "draft",
    label: "Draft",
    phase: "Preparation",
    helper: "Bounty belum terlihat aktif untuk supplier.",
  },
  {
    value: "published",
    label: "Published",
    phase: "Sourcing Active",
    helper: "Bounty aktif dan dapat dibaca supplier.",
  },
  {
    value: "closed",
    label: "Closed",
    phase: "Procurement Closed",
    helper: "Bounty ditutup dan tidak menerima proses lanjutan.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    phase: "Cancelled",
    helper: "Bounty dibatalkan dari lifecycle procurement.",
  },
];

const unitOptions = ["kg", "gram", "ikat", "pcs", "karung", "liter"];

const emptyItem = {
  item_name: "",
  target_quantity: 0,
  unit: "kg",
  notes: "",
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

function resolveBountyStatus(record: AdminBountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Published")
  );
}

function getEditableStatus(record: AdminBountyRecord): BountyStatusOption {
  const rawStatus = firstString(
    record,
    ["status", "publication_status", "approval_status"],
    "published"
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (["draft", "published", "closed", "cancelled"].includes(rawStatus)) {
    return rawStatus as BountyStatusOption;
  }

  if (["active", "available", "open"].includes(rawStatus)) return "published";
  if (["canceled"].includes(rawStatus)) return "cancelled";

  return "published";
}

function getStatusMeta(status: string) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");

  if (normalized === "draft") {
    return {
      label: "Draft",
      phase: "Preparation",
      className: "bg-surface-container-high text-on-surface",
      dotClassName: "bg-on-surface-variant",
    };
  }

  if (["published", "active", "available", "open"].includes(normalized)) {
    return {
      label: "Published",
      phase: "Sourcing Active",
      className: "bg-primary-container text-on-primary-container",
      dotClassName: "bg-primary animate-pulse",
    };
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return {
      label: "Closed",
      phase: "Procurement Closed",
      className: "bg-secondary-container text-on-secondary-container",
      dotClassName: "bg-secondary",
    };
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return {
      label: "Cancelled",
      phase: "Procurement Cancelled",
      className: "bg-error-container text-on-error-container",
      dotClassName: "bg-error",
    };
  }

  return {
    label: titleCaseStatus(status),
    phase: "Procurement Phase",
    className: "bg-surface-container-high text-on-surface",
    dotClassName: "bg-on-surface-variant",
  };
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

function getBountyId(record: AdminBountyRecord, fallback: string) {
  return firstString(record, ["id", "uuid", "bounty_id", "data.id"], fallback);
}

function getBountyCode(record: AdminBountyRecord, fallback: string) {
  const rawCode = firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.id"],
    fallback
  );

  return rawCode.startsWith("#") ? rawCode : `#${rawCode}`;
}

function getBountyTitle(record: AdminBountyRecord) {
  return firstString(record, ["title", "name", "data.title"], "Untitled Bounty");
}

function getBountyClient(record: AdminBountyRecord) {
  return firstString(
    record,
    ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
    "Client tidak tersedia"
  );
}

function getBountyDescription(record: AdminBountyRecord) {
  return firstString(
    record,
    ["description", "notes", "data.description"],
    "Tidak ada deskripsi bounty."
  );
}

function getBountyDeadline(record: AdminBountyRecord) {
  return firstString(
    record,
    ["deadline_at", "deadline", "deadlineAt", "data.deadline_at"],
    "-"
  );
}

function getCreatedBy(record: AdminBountyRecord) {
  return firstString(
    record,
    ["created_by.name", "creator.name", "admin.name", "user.name", "created_by"],
    "Admin"
  );
}

function getCreatedAt(record: AdminBountyRecord) {
  return firstString(record, ["created_at", "createdAt", "data.created_at"], "-");
}

function getUpdatedAt(record: AdminBountyRecord) {
  return firstString(record, ["updated_at", "updatedAt", "data.updated_at"], "-");
}

function getItemName(item: BountyItemRecord, index: number) {
  return firstString(item, ["item_name", "name"], `Item ${index + 1}`);
}

function getItemQtyValue(item: BountyItemRecord) {
  const value = firstString(item, ["target_quantity", "quantity", "qty"], "0");
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getItemQtyLabel(item: BountyItemRecord) {
  const value = firstString(item, ["target_quantity", "quantity", "qty"], "-");
  return value;
}

function getItemUnit(item: BountyItemRecord) {
  return firstString(item, ["unit"], "kg");
}

function getItemNotes(item: BountyItemRecord) {
  return firstString(
    item,
    ["notes", "description", "quality_notes", "specifications"],
    "Tidak ada spesifikasi tambahan."
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value || value === "-") return "";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized.slice(0, 16);
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function buildEditValues(record: AdminBountyRecord): CreateBountyFormValues {
  const items = getBountyItems(record);

  return {
    client_name:
      getBountyClient(record) === "Client tidak tersedia" ? "" : getBountyClient(record),
    title: getBountyTitle(record) === "Untitled Bounty" ? "" : getBountyTitle(record),
    description:
      getBountyDescription(record) === "Tidak ada deskripsi bounty."
        ? ""
        : getBountyDescription(record),
    deadline_at: toDateTimeLocalValue(getBountyDeadline(record)),
    items: items.length
      ? items.map((item, index) => ({
          item_name: getItemName(item, index),
          target_quantity: getItemQtyValue(item),
          unit: getItemUnit(item),
          notes: typeof item.notes === "string" ? item.notes : getItemNotes(item),
        }))
      : [{ ...emptyItem }],
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getTotalTarget(items: BountyItemRecord[]) {
  return items.reduce((total, item) => total + getItemQtyValue(item), 0);
}

function getFulfillmentStats(record: AdminBountyRecord, items: BountyItemRecord[]) {
  const target = Number(firstString(record, ["target_quantity", "total_target"], "0"));
  const fulfilled = Number(
    firstString(record, ["fulfilled_quantity", "contracted_quantity", "fulfilled"], "0")
  );

  const targetQty = Number.isFinite(target) && target > 0 ? target : getTotalTarget(items);
  const fulfilledQty = Number.isFinite(fulfilled) && fulfilled > 0 ? fulfilled : 0;

  const percent =
    targetQty > 0 ? Math.max(0, Math.min(100, Math.round((fulfilledQty / targetQty) * 100))) : 0;

  return {
    targetQty,
    fulfilledQty,
    percent,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-error">{message}</p>;
}

export default function AdminBountyDetailView({ bountyId }: AdminBountyDetailViewProps) {
  const searchParams = useSearchParams();
  const shouldOpenEditMode = searchParams.get("mode") === "edit";

  const [bounty, setBounty] = useState<AdminBountyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const [statusValue, setStatusValue] = useState<BountyStatusOption>("published");
  const [statusNote, setStatusNote] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [extendDeadlineValue, setExtendDeadlineValue] = useState("");
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBountyFormValues>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      client_name: "",
      title: "",
      description: "",
      deadline_at: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const normalized = useMemo(() => {
    if (!bounty) return null;

    const status = resolveBountyStatus(bounty);
    const statusMeta = getStatusMeta(status);
    const items = getBountyItems(bounty);
    const stats = getFulfillmentStats(bounty, items);
    const deadline = getBountyDeadline(bounty);

    return {
      id: getBountyId(bounty, bountyId),
      code: getBountyCode(bounty, `PROC-${bountyId}`),
      title: getBountyTitle(bounty),
      client: getBountyClient(bounty),
      description: getBountyDescription(bounty),
      status,
      statusMeta,
      items,
      stats,
      deadline,
      createdBy: getCreatedBy(bounty),
      createdAt: getCreatedAt(bounty),
      updatedAt: getUpdatedAt(bounty),
    };
  }, [bounty, bountyId]);

  const loadDetail = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await getAdminBountyDetail(bountyId);

      setBounty(response);
      setStatusValue(getEditableStatus(response));
      setExtendDeadlineValue(toDateTimeLocalValue(getBountyDeadline(response)));
      reset(buildEditValues(response));
      setErrorMessage(null);

      if (shouldOpenEditMode) {
        setIsEditing(true);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Gagal memuat detail bounty admin.");
      setBounty(null);
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
  }, [bountyId, shouldOpenEditMode]);

  const openEditForm = () => {
    if (bounty) reset(buildEditValues(bounty));
    setIsEditing(true);
  };

  const closeEditForm = () => {
    if (bounty) reset(buildEditValues(bounty));
    setIsEditing(false);
  };

  const onSubmitEdit = async (values: CreateBountyFormValues) => {
    try {
      const payload = {
        client_name: values.client_name.trim(),
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        deadline_at: formatDateTimeLocalToApi(values.deadline_at),
        items: values.items.map((item) => ({
          item_name: item.item_name.trim(),
          target_quantity: Number(item.target_quantity),
          unit: item.unit.trim(),
          notes: item.notes?.trim() || undefined,
        })),
      };

      await updateBounty(bountyId, payload);
      toast.success("Bounty berhasil diupdate.");
      setIsEditing(false);
      await loadDetail("refresh");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengupdate bounty."));
    }
  };

  const handleStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingStatus(true);

    try {
      await updateBountyStatus(bountyId, statusValue);
      toast.success("Status bounty berhasil diupdate.");

      if (statusNote.trim()) {
        toast.message("Catatan status tersimpan sebagai catatan lokal UI.", {
          description:
            "Endpoint Postman untuk update status hanya menerima field status.",
        });
      }

      setIsStatusModalOpen(false);
      setStatusNote("");
      await loadDetail("refresh");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengupdate status bounty."));
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleExtendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!extendDeadlineValue) {
      toast.error("Deadline baru wajib diisi.");
      return;
    }

    setIsSavingDeadline(true);

    try {
      await extendBountyDeadline(
        bountyId,
        formatDateTimeLocalToApi(extendDeadlineValue)
      );
      toast.success("Deadline bounty berhasil diperpanjang.");
      setIsExtendModalOpen(false);
      await loadDetail("refresh");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperpanjang deadline bounty."));
    } finally {
      setIsSavingDeadline(false);
    }
  };

  return (
    <AdminShell
      title="Bounty Detail"
      description="Detail, edit, audit, dan lifecycle status untuk bounty procurement."
      actions={
        <button
          type="button"
          onClick={() => loadDetail("refresh")}
          disabled={isLoading || isRefreshing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-70 sm:w-auto"
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
      {isLoading ? null : errorMessage || !bounty || !normalized ? (
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
      ) : (
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 flex items-center gap-2">
            <Link
              href="/admin/bounties"
              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-secondary-container/80 shadow-sm transition hover:bg-surface-container-low hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bounties
            </Link>
          </div>

          <section className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr,auto]">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-surface-container-highest px-3 py-1 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {normalized.code}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ${normalized.statusMeta.className}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${normalized.statusMeta.dotClassName}`}
                  />
                  {normalized.statusMeta.label}
                </span>
              </div>

              <h1 className="break-words font-headline text-4xl font-extrabold leading-none tracking-tight text-on-surface md:text-5xl">
                {normalized.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-6 text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-on-surface">
                    {normalized.client}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-tertiary" />
                  <span className="font-medium">
                    Deadline:{" "}
                    <span className="font-bold text-tertiary">
                      {formatDateLabel(normalized.deadline)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={isEditing ? closeEditForm : openEditForm}
                className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-6 py-3 font-bold text-on-surface transition hover:bg-surface-container-highest"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? "Cancel Edit" : "Edit"}
              </button>

              <button
                type="button"
                onClick={() => setIsExtendModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-6 py-3 font-bold text-on-surface transition hover:bg-surface-container-highest"
              >
                <CalendarDays className="h-4 w-4" />
                Extend
              </button>

              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02]"
              >
                <RefreshCw className="h-4 w-4" />
                Update Status
              </button>
            </div>
          </section>

          {isEditing ? (
            <section className="mb-8 rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Edit Mode
                  </p>
                  <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">
                    Edit Bounty Information
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Menggunakan endpoint PUT{" "}
                    <span className="font-mono">/api/admin/bounties/{bountyId}</span>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitEdit)} className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Client Name
                    </label>
                    <input
                      type="text"
                      {...register("client_name")}
                      className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.client_name?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Bounty Title
                    </label>
                    <input
                      type="text"
                      {...register("title")}
                      className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      {...register("deadline_at")}
                      className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.deadline_at?.message} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      {...register("description")}
                      className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.description?.message} />
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-low p-4 md:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Inventory Requirements</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Edit item permintaan bounty.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => append({ ...emptyItem })}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-4 rounded-xl bg-surface-container-lowest p-4 md:grid-cols-[minmax(0,1.3fr)_140px_130px_auto]"
                      >
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            Item Name
                          </label>
                          <input
                            type="text"
                            {...register(`items.${index}.item_name`)}
                            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError message={errors.items?.[index]?.item_name?.message} />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`items.${index}.target_quantity`, {
                              valueAsNumber: true,
                            })}
                            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError
                            message={errors.items?.[index]?.target_quantity?.message}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            Unit
                          </label>
                          <select
                            {...register(`items.${index}.unit`)}
                            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          >
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                          <FieldError message={errors.items?.[index]?.unit?.message} />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-bold text-on-error-container transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>

                        <div className="space-y-2 md:col-span-4">
                          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            Specifications
                          </label>
                          <textarea
                            rows={2}
                            {...register(`items.${index}.notes`)}
                            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError message={errors.items?.[index]?.notes?.message} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Bounty
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-8 lg:col-span-8">
              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h3 className="mb-6 flex items-center gap-3 font-headline text-xl font-bold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                    <Info className="h-5 w-5" />
                  </span>
                  Bounty Overview
                </h3>

                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <OverviewLine
                    label="Created By"
                    icon={UserRound}
                    value={normalized.createdBy}
                  />
                  <OverviewLine
                    label="Created At"
                    icon={Clock3}
                    value={formatDateLabel(normalized.createdAt)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Description & Notes
                  </label>
                  <p className="break-words leading-8 text-on-secondary-container">
                    {normalized.description}
                  </p>
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-3 font-headline text-xl font-bold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                      <ListChecks className="h-5 w-5" />
                    </span>
                    Inventory Requirements
                  </h3>

                  <button
                    type="button"
                    onClick={openEditForm}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/15">
                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Item Name
                        </th>
                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Target Qty
                        </th>
                        <th className="pb-4 text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Unit
                        </th>
                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Specifications
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y-8 divide-transparent">
                      {normalized.items.length ? (
                        normalized.items.map((item, index) => (
                          <tr
                            key={String(item.id ?? `${normalized.id}-${index}`)}
                            className="group transition-colors hover:bg-surface-container-low"
                          >
                            <td className="rounded-l-xl px-4 py-4 font-semibold">
                              {getItemName(item, index)}
                            </td>

                            <td className="px-4 py-4 font-bold text-primary">
                              {getItemQtyLabel(item)}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold uppercase">
                                {getItemUnit(item)}
                              </span>
                            </td>

                            <td className="rounded-r-xl px-4 py-4 text-sm text-on-secondary-container">
                              {getItemNotes(item)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-sm text-on-surface-variant"
                          >
                            Belum ada item pada response detail bounty.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-8 lg:col-span-4">
              <section className="relative overflow-hidden rounded-xl bg-slate-900 p-8 text-white">
                <TrendingUp className="absolute right-4 top-4 h-24 w-24 text-white/10" />

                <h4 className="mb-6 text-xs font-bold uppercase tracking-widest opacity-60">
                  Fulfillment Tracking
                </h4>

                <div className="mb-8">
                  <span className="font-headline text-5xl font-black">
                    {normalized.stats.percent}%
                  </span>
                  <span className="ml-2 text-sm opacity-60">Total Yield</span>
                </div>

                <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-primary-container"
                    style={{ width: `${normalized.stats.percent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs opacity-60">Contracted</p>
                    <p className="text-lg font-bold">
                      {normalized.stats.fulfilledQty.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs opacity-60">Target</p>
                    <p className="text-lg font-bold">
                      {normalized.stats.targetQty.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-low p-6 shadow-sm md:p-8">
                <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Key Client Contact
                </h4>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-8 w-8" />
                  </div>

                  <div className="min-w-0">
                    <h5 className="break-words text-lg font-bold">{normalized.client}</h5>
                    <p className="text-sm text-on-secondary-container">
                      Verified Procurement Partner
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ContactLine icon={UserRound} text={normalized.createdBy} />
                  <ContactLine icon={Mail} text="Contact data hidden by API response" />
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Activity Audit
                </h4>

                <div className="space-y-6">
                  <AuditLine
                    active
                    icon={Check}
                    title={`Status: ${normalized.statusMeta.label}`}
                    body={`Current phase: ${normalized.statusMeta.phase}`}
                  />
                  <AuditLine
                    icon={Pencil}
                    title="Last Updated"
                    body={formatDateLabel(normalized.updatedAt)}
                  />
                  <AuditLine
                    icon={Plus}
                    title="Bounty Created"
                    body={`${formatDateLabel(normalized.createdAt)} • By ${
                      normalized.createdBy
                    }`}
                    isLast
                  />
                </div>
              </section>

              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Admin Actions
                </h4>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={openEditForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Bounty
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:brightness-95"
                  >
                    <Activity className="h-4 w-4" />
                    Update Status
                  </button>
                </div>
              </section>
            </aside>
          </section>
        </div>
      )}

      {isStatusModalOpen && normalized ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between px-8 pb-4 pt-8">
              <div>
                <h2 className="font-headline text-2xl font-extrabold leading-tight tracking-tight text-on-surface">
                  Update Status
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Manage the lifecycle of {normalized.code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="-mr-2 -mt-2 rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div className="space-y-6 px-8 py-4">
                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    New Status
                  </label>

                  <select
                    value={statusValue}
                    onChange={(event) =>
                      setStatusValue(event.target.value as BountyStatusOption)
                    }
                    className="w-full cursor-pointer rounded-t-xl border-0 border-b-2 border-transparent bg-surface-container-low px-4 py-3 font-medium text-on-surface outline-none transition focus:border-primary focus:ring-0"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Optional Notes
                  </label>

                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    rows={4}
                    placeholder="Enter reason for status change or internal notes..."
                    className="w-full resize-none rounded-t-xl border-0 border-b-2 border-transparent bg-surface-container-low px-4 py-3 font-medium text-on-surface outline-none transition placeholder:text-outline/60 focus:border-primary focus:ring-0"
                  />
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-primary-container/20 bg-primary-container/10 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-xs font-medium leading-relaxed text-on-primary-container">
                    Changing status to{" "}
                    <span className="font-bold">
                      {
                        statusOptions.find((option) => option.value === statusValue)
                          ?.label
                      }
                    </span>{" "}
                    will update this bounty lifecycle. The current Postman endpoint only
                    sends <span className="font-mono font-bold">status</span> to the
                    backend.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 bg-surface-container-low px-8 py-6">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="rounded-xl px-6 py-2.5 font-headline text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingStatus}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-2.5 font-headline text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isExtendModalOpen && normalized ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between px-8 pb-4 pt-8">
              <div>
                <h2 className="font-headline text-2xl font-extrabold text-on-surface">
                  Extend Deadline
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Update deadline for {normalized.code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="-mr-2 -mt-2 rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit}>
              <div className="px-8 py-4">
                <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  New Deadline
                </label>

                <input
                  type="datetime-local"
                  value={extendDeadlineValue}
                  onChange={(event) => setExtendDeadlineValue(event.target.value)}
                  className="w-full rounded-t-xl border-0 border-b-2 border-transparent bg-surface-container-low px-4 py-3 font-medium text-on-surface outline-none transition focus:border-primary focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-end gap-3 bg-surface-container-low px-8 py-6">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="rounded-xl px-6 py-2.5 font-headline text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingDeadline}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-2.5 font-headline text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingDeadline ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function OverviewLine({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

function ContactLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="break-words text-sm font-medium">{text}</span>
    </div>
  );
}

function AuditLine({
  icon: Icon,
  title,
  body,
  active,
  isLast,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast ? (
        <div className="absolute bottom-[-24px] left-3 top-8 w-0.5 bg-outline-variant/30" />
      ) : null}

      <div
        className={
          active
            ? "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white"
            : "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant"
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0">
        <p className="break-words text-sm font-bold">{title}</p>
        <p className="mt-1 break-words text-xs text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}