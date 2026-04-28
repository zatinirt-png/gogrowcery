"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Package2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createBounty } from "@/features/bounty/api";
import {
  createBountySchema,
  type CreateBountyFormValues,
} from "@/features/bounty/schema";
import {
  formatDateTimeLocalToApi,
  getBountyErrorMessage,
  getBountyValidationErrors,
} from "@/features/bounty/utils";

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

export default function BountyCreateForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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

  const onSubmit = async (values: CreateBountyFormValues) => {
    setFormError(null);

    try {
      const payload = {
        client_name: values.client_name,
        title: values.title,
        description: values.description?.trim() || undefined,
        deadline_at: formatDateTimeLocalToApi(values.deadline_at),
        items: values.items.map((item) => ({
          item_name: item.item_name.trim(),
          target_quantity: Number(item.target_quantity),
          unit: item.unit.trim(),
          notes: item.notes?.trim() || undefined,
        })),
      };

      const response = await createBounty(payload);

      toast.success(response.message || "Bounty berhasil dibuat");
      reset({
        client_name: "",
        title: "",
        description: "",
        deadline_at: "",
        items: [{ ...emptyItem }],
      });
      router.push("/admin/bounties");
      router.refresh();
    } catch (error) {
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

      const message = getBountyErrorMessage(error);
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
      <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:p-8">
        <div className="mb-6 flex items-start gap-3 sm:mb-8">
          <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">
            <Info className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Section 1
            </p>
            <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
              Basic Information
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
          <div className="space-y-2 min-w-0">
            <label
              htmlFor="client_name"
              className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant"
            >
              Client Name
            </label>
            <input
              id="client_name"
              type="text"
              placeholder="e.g. PT Segar Jaya"
              {...register("client_name")}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
            />
            <FieldError message={errors.client_name?.message} />
          </div>

          <div className="space-y-2 min-w-0">
            <label
              htmlFor="title"
              className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant"
            >
              Bounty Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Kebutuhan Sayuran Minggu Ini"
              {...register("title")}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="space-y-2 w-full md:max-w-md">
            <label
              htmlFor="deadline_at"
              className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant"
            >
              Deadline
            </label>
            <input
              id="deadline_at"
              type="datetime-local"
              {...register("deadline_at")}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
            />
            <FieldError message={errors.deadline_at?.message} />
          </div>

          <div className="space-y-2 md:col-span-2 min-w-0">
            <label
              htmlFor="description"
              className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant"
            >
              Description / Notes
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Tambahkan konteks kebutuhan, kualitas, atau catatan khusus bounty ini..."
              {...register("description")}
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
            />
            <FieldError message={errors.description?.message} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-low p-4 shadow-sm sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">
              <Package2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                Section 2
              </p>
              <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                Bounty Items
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => append({ ...emptyItem })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary shadow-sm transition hover:bg-white sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Item {index + 1}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Isi nama item, target quantity, satuan, dan catatan opsional.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-2xl text-error transition hover:bg-error-container/60 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Hapus item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-4 min-w-0">
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="Bayam"
                    {...register(`items.${index}.item_name`)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                  />
                  <FieldError message={errors.items?.[index]?.item_name?.message} />
                </div>

                <div className="space-y-2 md:col-span-2 min-w-0">
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50"
                    {...register(`items.${index}.target_quantity`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                  />
                  <FieldError
                    message={errors.items?.[index]?.target_quantity?.message}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 min-w-0">
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Unit
                  </label>
                  <select
                    {...register(`items.${index}.unit`)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                  >
                    {unitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.items?.[index]?.unit?.message} />
                </div>

                <div className="space-y-2 md:col-span-4 min-w-0">
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Pilih yang segar"
                    {...register(`items.${index}.notes`)}
                    className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3.5 text-sm outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                  />
                  <FieldError message={errors.items?.[index]?.notes?.message} />
                </div>
              </div>
            </div>
          ))}

          {typeof errors.items?.message === "string" ? (
            <p className="text-sm font-medium text-error">{errors.items.message}</p>
          ) : null}
        </div>
      </section>

      {formError ? (
        <div className="rounded-2xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {formError}
        </div>
      ) : null}

      <footer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full max-w-2xl rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm leading-6 text-on-primary-container">
          Tombol publish langsung mengirim bounty ke endpoint admin. Setelah berhasil,
          halaman akan diarahkan ke daftar bounty live dari API.
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() =>
              reset({
                client_name: "",
                title: "",
                description: "",
                deadline_at: "",
                items: [{ ...emptyItem }],
              })
            }
            className="inline-flex w-full items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low sm:w-auto"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[190px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Bounty"
            )}
          </button>
        </div>
      </footer>
    </form>
  );
}