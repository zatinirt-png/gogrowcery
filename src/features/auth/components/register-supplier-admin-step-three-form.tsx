"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepThreeSchema,
  type SupplierAdminLandValues,
  type SupplierAdminStepThreeValues,
} from "@/features/auth/schema";
import {
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: Record<string, unknown>;
  step3?: SupplierAdminStepThreeValues;
  updatedAt?: string;
};

const createEmptyLand = (index: number): SupplierAdminLandValues => ({
  nama_lahan: `Lahan ${index}`,
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

function Label({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-bold text-on-surface">
      {text}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
}

function normalizeLands(lands: SupplierAdminLandValues[]) {
  return lands.map((land, index) => ({
    ...land,
    nama_lahan: land.nama_lahan?.trim() || `Lahan ${index + 1}`,
  }));
}

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
      lands: [createEmptyLand(1)],
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

      replace(normalizeLands(parsed.step3.lands));
    } catch {
      // ignore malformed draft
    }
  }, [replace]);

  const saveDraft = (values: SupplierAdminStepThreeValues) => {
    let parsed: SupplierAdminDraft = {};

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw) as SupplierAdminDraft;
    } catch {
      parsed = {};
    }

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...parsed,
        step3: {
          lands: normalizeLands(values.lands),
        },
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push(supplierGuidedRoutes.step2);
  };

  const onSubmit = async (values: SupplierAdminStepThreeValues) => {
    saveDraft(values);
    toast.success("Data lahan tersimpan.");
    router.push(supplierGuidedRoutes.step4);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.lands?.message && (
        <div className="rounded-2xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {errors.lands.message}
        </div>
      )}

      {fields.map((field, index) => {
        const landErrors = errors.lands?.[index];

        return (
          <section
            key={field.id}
            className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Data lahan {index + 1}
                </p>
                <h2 className="mt-2 font-headline text-2xl font-bold text-on-surface">
                  Informasi lahan
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (fields.length === 1) {
                    toast.error("Minimal harus ada satu data lahan.");
                    return;
                  }
                  remove(index);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
              Nama kebun tidak ditampilkan ke user. Sistem akan tetap menyimpan penanda internal lahan secara otomatis.
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <input type="hidden" {...register(`lands.${index}.nama_lahan` as const)} />

              <div>
                <Label text="Nama pemilik / pengelola lahan" required />
                <input
                  type="text"
                  {...register(`lands.${index}.nama_pemilik` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.nama_pemilik && <p className="mt-2 text-sm font-medium text-error">{landErrors.nama_pemilik.message}</p>}
              </div>

              <div>
                <Label text="Nomor HP aktif" required />
                <input
                  type="tel"
                  {...register(`lands.${index}.no_hp` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.no_hp && <p className="mt-2 text-sm font-medium text-error">{landErrors.no_hp.message}</p>}
              </div>

              <div className="md:col-span-2">
                <Label text="Alamat lahan" required />
                <textarea
                  rows={4}
                  {...register(`lands.${index}.alamat_lahan` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.alamat_lahan && <p className="mt-2 text-sm font-medium text-error">{landErrors.alamat_lahan.message}</p>}
              </div>

              <div>
                <Label text="Desa / Kelurahan" required />
                <input
                  type="text"
                  {...register(`lands.${index}.desa` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.desa && <p className="mt-2 text-sm font-medium text-error">{landErrors.desa.message}</p>}
              </div>

              <div>
                <Label text="Kecamatan" required />
                <input
                  type="text"
                  {...register(`lands.${index}.kecamatan` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.kecamatan && <p className="mt-2 text-sm font-medium text-error">{landErrors.kecamatan.message}</p>}
              </div>

              <div>
                <Label text="Kabupaten / Kota" required />
                <input
                  type="text"
                  {...register(`lands.${index}.kabupaten` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.kabupaten && <p className="mt-2 text-sm font-medium text-error">{landErrors.kabupaten.message}</p>}
              </div>

              <div>
                <Label text="Provinsi" required />
                <input
                  type="text"
                  {...register(`lands.${index}.provinsi` as const)}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.provinsi && <p className="mt-2 text-sm font-medium text-error">{landErrors.provinsi.message}</p>}
              </div>

              <div>
                <Label text="Status kepemilikan" required />
                <select
                  {...register(`lands.${index}.kepemilikan` as const)}
                  className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="milik_sendiri">Milik sendiri</option>
                  <option value="sewa">Sewa</option>
                  <option value="kerjasama">Kerja sama</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                {landErrors?.kepemilikan && <p className="mt-2 text-sm font-medium text-error">{landErrors.kepemilikan.message}</p>}
              </div>

              <div>
                <Label text="Luas lahan (m²)" required />
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  {...register(`lands.${index}.luas_lahan_m2` as const, { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {landErrors?.luas_lahan_m2 && <p className="mt-2 text-sm font-medium text-error">{landErrors.luas_lahan_m2.message}</p>}
              </div>

              <div>
                <Label text="Status lahan" required />
                <select
                  {...register(`lands.${index}.status_aktif` as const)}
                  className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="aktif">Aktif</option>
                  <option value="tidak_aktif">Tidak aktif</option>
                </select>
                {landErrors?.status_aktif && <p className="mt-2 text-sm font-medium text-error">{landErrors.status_aktif.message}</p>}
              </div>
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => append(createEmptyLand(fields.length + 1))}
        className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-3 font-bold text-on-surface transition hover:bg-surface-container-high"
      >
        <PlusCircle className="h-4 w-4" />
        Tambah lahan
      </button>

      <div className="flex flex-col gap-4 border-t border-outline-variant/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-6 py-3.5 font-bold text-on-surface transition hover:bg-surface-container-high"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="signature-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Lanjut ke pencairan
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}