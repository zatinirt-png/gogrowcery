"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  BarChart3,
  Info,
  Loader2,
  Network,
  Package2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createBounty,
  extractCreatedBountyId,
  updateBountyStatus,
} from "@/features/bounty/api";
import {
  createBountySchema,
  type CreateBountyFormValues,
} from "@/features/bounty/schema";
import {
  formatDateTimeLocalToApi,
  getBountyErrorMessage,
  getBountyValidationErrors,
} from "@/features/bounty/utils";

const unitOptions = ["kg", "gram", "ikat", "pcs", "karung", "liter", "ton", "unit"];

const emptyItem = {
  item_name: "",
  target_quantity: 0,
  unit: "kg",
  notes: "",
};

type SubmitMode = "draft" | "publish";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-sm font-medium text-error">{message}</p>;
}

export default function BountyCreateForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
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

  const resetForm = () => {
    reset({
      client_name: "",
      title: "",
      description: "",
      deadline_at: "",
      items: [{ ...emptyItem }],
    });
    setFormError(null);
  };

  const applyServerValidationErrors = (error: unknown) => {
    const validationErrors = getBountyValidationErrors(error);

    if (validationErrors.client_name) {
      setError("client_name", {
        type: "server",
        message: validationErrors.client_name,
      });
    }

    if (validationErrors.title) {
      setError("title", {
        type: "server",
        message: validationErrors.title,
      });
    }

    if (validationErrors.description) {
      setError("description", {
        type: "server",
        message: validationErrors.description,
      });
    }

    if (validationErrors.deadline_at) {
      setError("deadline_at", {
        type: "server",
        message: validationErrors.deadline_at,
      });
    }

    Object.entries(validationErrors).forEach(([field, message]) => {
      const itemMatch = field.match(
        /^items\.(\d+)\.(item_name|target_quantity|unit|notes)$/
      );

      if (!itemMatch) return;

      const index = Number(itemMatch[1]);
      const key = itemMatch[2] as
        | "item_name"
        | "target_quantity"
        | "unit"
        | "notes";

      setError(`items.${index}.${key}`, {
        type: "server",
        message,
      });
    });
  };

  const buildPayload = (values: CreateBountyFormValues) => {
    return {
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
  };

  const submitBounty = async (
    values: CreateBountyFormValues,
    mode: SubmitMode
  ) => {
    setFormError(null);
    setSubmitMode(mode);

    try {
      const response = await createBounty(buildPayload(values));
      const createdBountyId = extractCreatedBountyId(response);

      if (createdBountyId) {
        try {
          await updateBountyStatus(
            createdBountyId,
            mode === "publish" ? "published" : "draft"
          );
        } catch (statusError) {
          const statusMessage =
            statusError instanceof Error
              ? statusError.message
              : mode === "publish"
                ? "Bounty dibuat, tetapi gagal dipublish."
                : "Bounty dibuat, tetapi status draft gagal dipastikan.";

          toast.warning(statusMessage);
        }
      } else {
        toast.warning(
          "ID bounty tidak ditemukan dari response, status belum bisa diubah otomatis."
        );
      }

      if (mode === "publish") {
        toast.success("Bounty berhasil dibuat dan dipublish ke supplier.");
      } else {
        toast.success("Bounty berhasil disimpan sebagai draft.");
      }

      resetForm();

      if (createdBountyId) {
        router.push(`/admin/bounties/${encodeURIComponent(createdBountyId)}`);
      } else {
        router.push("/admin/bounties");
      }

      router.refresh();
    } catch (error) {
      applyServerValidationErrors(error);

      const message = getBountyErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitMode(null);
    }
  };

  const isDraftSaving = isSubmitting && submitMode === "draft";
  const isPublishing = isSubmitting && submitMode === "publish";

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-[3.5rem]">
            Create Bounty
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-7 text-on-surface-variant md:text-base">
            Initialize a new procurement request. Distributed items will be
            tracked via the GoGrowcery supplier network for real-time
            fulfillment.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Draft Mode
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((values) => submitBounty(values, "publish"))}
        className="space-y-8"
      >
        <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="client_name"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >
                Client Name
              </label>
              <input
                id="client_name"
                type="text"
                placeholder="e.g. GoGrowcery Retail Group"
                {...register("client_name")}
                className="w-full rounded-xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container"
              />
              <FieldError message={errors.client_name?.message} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >
                Bounty Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Q4 Organic Sourcing - Western Region"
                {...register("title")}
                className="w-full rounded-xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container"
              />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label
                htmlFor="deadline_at"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >
                Deadline
              </label>
              <input
                id="deadline_at"
                type="datetime-local"
                {...register("deadline_at")}
                className="w-full rounded-xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium text-on-surface outline-none transition focus:ring-2 focus:ring-primary-container"
              />
              <FieldError message={errors.deadline_at?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="description"
                className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >
                Description / Notes
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Specify regional constraints, quality requirements, or certification notes for this bounty..."
                {...register("description")}
                className="w-full resize-none rounded-xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium leading-6 text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container"
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-low p-5 md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Package2 className="h-5 w-5 text-primary" />
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Bounty Items
              </h2>
            </div>

            <button
              type="button"
              onClick={() => append({ ...emptyItem })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-primary shadow-sm transition hover:bg-white md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            <div className="hidden grid-cols-12 gap-4 px-4 md:grid">
              <div className="col-span-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Item Name
              </div>
              <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Quantity
              </div>
              <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Unit
              </div>
              <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Notes
              </div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 items-start gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm md:grid-cols-12 md:items-center"
              >
                <div className="col-span-4 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:hidden">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="Organic Avocado"
                    {...register(`items.${index}.item_name`)}
                    className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-1 focus:ring-primary"
                  />
                  <FieldError message={errors.items?.[index]?.item_name?.message} />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:hidden">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="1200"
                    {...register(`items.${index}.target_quantity`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-1 focus:ring-primary"
                  />
                  <FieldError
                    message={errors.items?.[index]?.target_quantity?.message}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:hidden">
                    Unit
                  </label>
                  <select
                    {...register(`items.${index}.unit`)}
                    className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none transition focus:ring-1 focus:ring-primary"
                  >
                    {unitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.items?.[index]?.unit?.message} />
                </div>

                <div className="col-span-3 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant md:hidden">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Hass variety preferred"
                    {...register(`items.${index}.notes`)}
                    className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-1 focus:ring-primary"
                  />
                  <FieldError message={errors.items?.[index]?.notes?.message} />
                </div>

                <div className="col-span-1 flex justify-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-error transition hover:bg-error-container/40 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Delete item ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {typeof errors.items?.message === "string" ? (
              <p className="text-sm font-medium text-error">{errors.items.message}</p>
            ) : null}
          </div>
        </section>

        {formError ? (
          <div className="rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {formError}
          </div>
        ) : null}

        <footer className="flex flex-col items-center justify-between gap-4 pt-4 md:flex-row">
          <Link
            href="/admin/bounties"
            className="inline-flex w-full items-center justify-center rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant transition hover:bg-surface-container-high md:w-auto"
          >
            Cancel
          </Link>

          <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
            <button
              type="button"
              onClick={() =>
                handleSubmit((values) => submitBounty(values, "draft"))()
              }
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-10 py-4 text-sm font-bold uppercase tracking-widest text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDraftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="signature-gradient inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-70"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publish Bounty
                </>
              )}
            </button>
          </div>
        </footer>
      </form>

      <section className="mt-20 grid grid-cols-1 gap-8 border-t border-outline-variant/15 pt-10 md:grid-cols-3">
        <FeatureNote
          icon={BadgeCheck}
          title="Verified Sourcing"
          description="Every bounty item is prepared for supplier review and quality matching."
        />
        <FeatureNote
          icon={Network}
          title="Smart Distribution"
          description="Published bounties can be routed to eligible GoGrowcery suppliers."
        />
        <FeatureNote
          icon={BarChart3}
          title="Real-time Analytics"
          description="Track partial fulfillment progress directly from your admin dashboard."
        />
      </section>
    </div>
  );
}

function FeatureNote({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BadgeCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          {description}
        </p>
      </div>
    </div>
  );
}