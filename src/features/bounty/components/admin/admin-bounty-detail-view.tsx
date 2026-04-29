"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
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
import BountyDetailPanel from "@/features/bounty/components/bounty-detail-panel";
import {
  firstString,
  getBountyClient,
  getBountyDeadline,
  getBountyDescription,
  getBountyItems,
  getBountyTitle,
  getItemName,
  resolveBountyStatus,
} from "@/features/bounty/bounty-formatters";
import {
  createBountySchema,
  type CreateBountyFormValues,
} from "@/features/bounty/schema";
import { formatDateTimeLocalToApi } from "@/features/bounty/utils";

type AdminBountyDetailViewProps = {
  bountyId: string;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const unitOptions = ["kg", "gram", "ikat", "pcs", "karung", "liter"];

const emptyItem = {
  item_name: "",
  target_quantity: 0,
  unit: "kg",
  notes: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-sm font-medium text-error">{message}</p>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

function getItemQuantityNumber(item: BountyItemRecord) {
  const value = firstString(item, ["target_quantity", "quantity", "qty"], "0");
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getItemUnit(item: BountyItemRecord) {
  return firstString(item, ["unit"], "kg");
}

function buildEditValues(record: AdminBountyRecord): CreateBountyFormValues {
  const items = getBountyItems(record);

  return {
    client_name: getBountyClient(record) === "Client tidak tersedia" ? "" : getBountyClient(record),
    title: getBountyTitle(record) === "Untitled Bounty" ? "" : getBountyTitle(record),
    description:
      getBountyDescription(record) === "Tidak ada deskripsi bounty."
        ? ""
        : getBountyDescription(record),
    deadline_at: toDateTimeLocalValue(getBountyDeadline(record)),
    items: items.length
      ? items.map((item, index) => ({
          item_name: getItemName(item, index),
          target_quantity: getItemQuantityNumber(item),
          unit: getItemUnit(item),
          notes: typeof item.notes === "string" ? item.notes : "",
        }))
      : [{ ...emptyItem }],
  };
}

function getEditableStatus(record: AdminBountyRecord) {
  const rawStatus = firstString(
    record,
    ["status", "publication_status", "approval_status"],
    "published"
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (statusOptions.some((option) => option.value === rawStatus)) {
    return rawStatus;
  }

  return "published";
}

export default function AdminBountyDetailView({ bountyId }: AdminBountyDetailViewProps) {
  const [bounty, setBounty] = useState<AdminBountyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusValue, setStatusValue] = useState("published");
  const [extendDeadlineValue, setExtendDeadlineValue] = useState("");

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
  }, [bountyId]);

  const openEditForm = () => {
    if (bounty) {
      reset(buildEditValues(bounty));
    }

    setIsEditing(true);
  };

  const closeEditForm = () => {
    if (bounty) {
      reset(buildEditValues(bounty));
    }

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

  const handleUpdateStatus = async () => {
    try {
      await updateBountyStatus(bountyId, statusValue);
      toast.success("Status bounty berhasil diupdate.");
      await loadDetail("refresh");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengupdate status bounty."));
    }
  };

  const handleExtendDeadline = async () => {
    if (!extendDeadlineValue) {
      toast.error("Deadline baru wajib diisi.");
      return;
    }

    try {
      await extendBountyDeadline(
        bountyId,
        formatDateTimeLocalToApi(extendDeadlineValue)
      );
      toast.success("Deadline bounty berhasil diperpanjang.");
      await loadDetail("refresh");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperpanjang deadline bounty."));
    }
  };

  return (
    <AdminShell
      title="Bounty Detail"
      description="Review, edit, publish, close, atau perpanjang deadline bounty sesuai endpoint Postman."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => loadDetail("refresh")}
            disabled={isLoading || isRefreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 sm:w-auto"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={openEditForm}
              disabled={!bounty}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-70 sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              Edit Bounty
            </button>
          ) : (
            <button
              type="button"
              onClick={closeEditForm}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low sm:w-auto"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </button>
          )}

          <Link
            href="/admin/bounties/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </Link>
        </div>
      }
    >
      {isLoading ? null : errorMessage || !bounty ? (
        <section className="rounded-3xl border border-error/15 bg-error-container p-5 shadow-sm">
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
        <div className="grid gap-5 sm:gap-6">
          <section className="grid gap-4 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-on-surface">Update Status</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <select
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:brightness-95"
                >
                  <Save className="h-4 w-4" />
                  Save Status
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                Menggunakan endpoint PATCH{" "}
                <span className="font-mono">/api/admin/bounties/{bountyId}/status</span>
                .
              </p>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-on-surface">Extend Deadline</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="datetime-local"
                  value={extendDeadlineValue}
                  onChange={(event) => setExtendDeadlineValue(event.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />

                <button
                  type="button"
                  onClick={handleExtendDeadline}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:brightness-95"
                >
                  <Save className="h-4 w-4" />
                  Extend
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                Menggunakan endpoint PATCH{" "}
                <span className="font-mono">
                  /api/admin/bounties/{bountyId}/extend-deadline
                </span>
                .
              </p>
            </div>
          </section>

          {isEditing ? (
            <section className="rounded-3xl border border-primary/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    Edit Mode
                  </p>
                  <h2 className="mt-1 font-headline text-xl font-extrabold text-on-surface">
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitEdit)} className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Client Name
                    </label>
                    <input
                      type="text"
                      {...register("client_name")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.client_name?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Bounty Title
                    </label>
                    <input
                      type="text"
                      {...register("title")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      {...register("deadline_at")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.deadline_at?.message} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      {...register("description")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.description?.message} />
                  </div>
                </div>

                <div className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Bounty Items</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Edit item permintaan bounty.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => append({ ...emptyItem })}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-4 rounded-2xl bg-surface-container-lowest p-4 md:grid-cols-[minmax(0,1.3fr)_140px_130px_auto]"
                      >
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                            Item Name
                          </label>
                          <input
                            type="text"
                            {...register(`items.${index}.item_name`)}
                            className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError message={errors.items?.[index]?.item_name?.message} />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`items.${index}.target_quantity`, {
                              valueAsNumber: true,
                            })}
                            className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError
                            message={errors.items?.[index]?.target_quantity?.message}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                            Unit
                          </label>
                          <select
                            {...register(`items.${index}.unit`)}
                            className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
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
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-error/15 bg-error-container px-4 py-3 text-sm font-bold text-on-error-container transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>

                        <div className="space-y-2 md:col-span-4">
                          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                            Notes
                          </label>
                          <textarea
                            rows={2}
                            {...register(`items.${index}.notes`)}
                            className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                          />
                          <FieldError message={errors.items?.[index]?.notes?.message} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {typeof errors.items?.message === "string" ? (
                    <p className="mt-3 text-sm font-medium text-error">
                      {errors.items.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-70"
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

          <BountyDetailPanel
            record={bounty}
            backHref="/admin/bounties"
            backLabel="Kembali ke Bounty Directory"
            viewerName="Admin"
            viewerRole="admin"
            sourceLabel={`Status: ${resolveBountyStatus(bounty)}`}
          />
        </div>
      )}
    </AdminShell>
  );
}