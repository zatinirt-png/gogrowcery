"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepThreeSchema,
  type SupplierAdminLandValues,
  type SupplierAdminStepThreeValues,
} from "@/features/auth/schema";

const DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: Record<string, unknown>;
  step3?: SupplierAdminStepThreeValues;
  updatedAt?: string;
};

const emptyLand = (): SupplierAdminLandValues => ({
  nama_lahan: "",
  nama_pemilik: "",
  no_hp: "",
  alamat_lahan: "",
  desa: "",
  kecamatan: "",
  kabupaten: "",
  provinsi: "",
  kepemilikan: "milik_sendiri",
  luas_lahan_m2: 0,
  status_aktif: "aktif",
});

export default function RegisterSupplierAdminStepThreeForm() {
  const router = useRouter();

  const {
  register,
  control,
  handleSubmit,
  getValues,
  formState: { errors, isSubmitting },
} = useForm<SupplierAdminStepThreeValues>({
  resolver: zodResolver(supplierAdminStepThreeSchema),
  defaultValues: {
    lands: [emptyLand()],
  },
  mode: "onSubmit",
});

const { fields, append, remove, replace } = useFieldArray({
  control,
  name: "lands",
});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      if (!parsed.step3?.lands?.length) return;

      replace(parsed.step3.lands);
    } catch {
      // ignore malformed draft
    }
  }, [replace]);

  const saveDraft = (values: SupplierAdminStepThreeValues) => {
    let parsed: SupplierAdminDraft = {};

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        parsed = JSON.parse(raw) as SupplierAdminDraft;
      }
    } catch {
      parsed = {};
    }

    const nextDraft: SupplierAdminDraft = {
      ...parsed,
      step3: values,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push("/register/supplier/admin/step-2");
  };

  const handleSaveProgress = () => {
    saveDraft(getValues());
    toast.success("Draft step 3 berhasil disimpan.");
  };

  const onSubmit = async (values: SupplierAdminStepThreeValues) => {
    saveDraft(values);
    toast.success("Step 3 saved. Lanjut ke Step 4.");
    router.push("/register/supplier/admin/step-4");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errors.lands?.message && (
        <div className="rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {errors.lands.message}
        </div>
      )}

      {fields.map((field, index) => {
        const landErrors = errors.lands?.[index];

        return (
          <div
            key={field.id}
            className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/20 text-primary">
                  <span className="font-headline text-lg font-bold">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">
                    Land Parcel #{index + 1}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {getValues(`lands.${index}.status_aktif`) === "aktif"
                      ? "Active Record"
                      : "Inactive Record"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (fields.length === 1) {
                      toast.error("Minimal harus ada satu data lahan.");
                      return;
                    }
                    remove(index);
                  }}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-surface-container-low hover:text-error"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Land Name
                </label>
                <input
                  type="text"
                  {...register(`lands.${index}.nama_lahan` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
                {landErrors?.nama_lahan && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.nama_lahan.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Owner Name
                </label>
                <input
                  type="text"
                  {...register(`lands.${index}.nama_pemilik` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
                {landErrors?.nama_pemilik && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.nama_pemilik.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register(`lands.${index}.no_hp` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
                {landErrors?.no_hp && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.no_hp.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Ownership Type
                </label>
                <select
                  {...register(`lands.${index}.kepemilikan` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                >
                  <option value="">Pilih</option>
                  <option value="milik_sendiri">Milik Sendiri</option>
                  <option value="sewa">Sewa</option>
                  <option value="kerjasama">Kerjasama</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                {landErrors?.kepemilikan && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.kepemilikan.message}
                  </p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  {...register(`lands.${index}.alamat_lahan` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
                {landErrors?.alamat_lahan && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.alamat_lahan.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Village
                  </label>
                  <input
                    type="text"
                    {...register(`lands.${index}.desa` as const)}
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                  />
                  {landErrors?.desa && (
                    <p className="text-sm font-medium text-error">
                      {landErrors.desa.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    District
                  </label>
                  <input
                    type="text"
                    {...register(`lands.${index}.kecamatan` as const)}
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                  />
                  {landErrors?.kecamatan && (
                    <p className="text-sm font-medium text-error">
                      {landErrors.kecamatan.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Regency
                  </label>
                  <input
                    type="text"
                    {...register(`lands.${index}.kabupaten` as const)}
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                  />
                  {landErrors?.kabupaten && (
                    <p className="text-sm font-medium text-error">
                      {landErrors.kabupaten.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Province
                  </label>
                  <input
                    type="text"
                    {...register(`lands.${index}.provinsi` as const)}
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                  />
                  {landErrors?.provinsi && (
                    <p className="text-sm font-medium text-error">
                      {landErrors.provinsi.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Land Area (m2)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    {...register(`lands.${index}.luas_lahan_m2` as const, {
                      setValueAs: (value) => {
                        if (value === "" || value === null || value === undefined) {
                          return NaN;
                        }
                        return Number(value);
                      },
                    })}
                    className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 pr-12 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    m²
                  </span>
                </div>
                {landErrors?.luas_lahan_m2 && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.luas_lahan_m2.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Active Status
                </label>
                <select
                  {...register(`lands.${index}.status_aktif` as const)}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                >
                  <option value="">Pilih</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                {landErrors?.status_aktif && (
                  <p className="text-sm font-medium text-error">
                    {landErrors.status_aktif.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append(emptyLand())}
        className="flex w-full items-center justify-center gap-4 rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low/30 p-8 text-slate-500 transition-all hover:border-primary hover:text-primary"
      >
        <PlusCircle className="h-5 w-5" />
        <span className="font-bold tracking-tight">Add Another Land Parcel</span>
      </button>

      <div className="mt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-surface-container-low"
        >
          Back to Personal Details
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSaveProgress}
            className="rounded-xl border-2 border-primary/20 px-8 py-3 font-bold text-primary transition-colors hover:bg-primary/5"
          >
            Save Progress
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="signature-gradient flex items-center gap-2 rounded-xl px-10 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Payout Info
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}