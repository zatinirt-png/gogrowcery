"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepTwoSchema,
  type SupplierAdminStepTwoValues,
} from "@/features/auth/schema";
import {
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: SupplierAdminStepTwoValues;
  updatedAt?: string;
};

function Label({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-bold text-on-surface">
      {text}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
}

export default function RegisterSupplierAdminStepTwoForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SupplierAdminStepTwoValues>({
    resolver: zodResolver(supplierAdminStepTwoSchema),
    defaultValues: {
      nama_lengkap: "",
      no_ktp: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jenis_kelamin: "",
      no_hp: "",
      alamat_domisili: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      if (!parsed.step2) return;

      setValue("nama_lengkap", parsed.step2.nama_lengkap ?? "");
      setValue("no_ktp", parsed.step2.no_ktp ?? "");
      setValue("tempat_lahir", parsed.step2.tempat_lahir ?? "");
      setValue("tanggal_lahir", parsed.step2.tanggal_lahir ?? "");
      setValue("jenis_kelamin", parsed.step2.jenis_kelamin ?? "");
      setValue("no_hp", parsed.step2.no_hp ?? "");
      setValue("alamat_domisili", parsed.step2.alamat_domisili ?? "");
      setValue("desa", parsed.step2.desa ?? "");
      setValue("kecamatan", parsed.step2.kecamatan ?? "");
      setValue("kabupaten", parsed.step2.kabupaten ?? "");
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  const saveDraft = (values: SupplierAdminStepTwoValues) => {
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
        step2: values,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push(supplierGuidedRoutes.start);
  };

  const onSubmit = async (values: SupplierAdminStepTwoValues) => {
    saveDraft(values);
    toast.success("Data diri tersimpan.");
    router.push(supplierGuidedRoutes.step3);
  };

  return (
    <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-8 rounded-2xl bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
        Kolom dengan tanda <span className="font-bold text-error">*</span> wajib diisi.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section>
          <h2 className="mb-5 font-headline text-2xl font-bold text-on-surface">
            Identitas utama
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label text="Nama lengkap sesuai identitas" required />
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                {...register("nama_lengkap")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.nama_lengkap && <p className="mt-2 text-sm font-medium text-error">{errors.nama_lengkap.message}</p>}
            </div>

            <div>
              <Label text="Nomor KTP / NIK" required />
              <input
                type="text"
                inputMode="numeric"
                placeholder="16 digit nomor identitas"
                {...register("no_ktp")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.no_ktp && <p className="mt-2 text-sm font-medium text-error">{errors.no_ktp.message}</p>}
            </div>

            <div>
              <Label text="Tempat lahir" required />
              <input
                type="text"
                placeholder="Contoh: Bandung"
                {...register("tempat_lahir")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.tempat_lahir && <p className="mt-2 text-sm font-medium text-error">{errors.tempat_lahir.message}</p>}
            </div>

            <div>
              <Label text="Tanggal lahir" required />
              <input
                type="date"
                {...register("tanggal_lahir")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.tanggal_lahir && <p className="mt-2 text-sm font-medium text-error">{errors.tanggal_lahir.message}</p>}
            </div>

            <div>
              <Label text="Jenis kelamin" required />
              <select
                {...register("jenis_kelamin")}
                className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
              {errors.jenis_kelamin && <p className="mt-2 text-sm font-medium text-error">{errors.jenis_kelamin.message}</p>}
            </div>

            <div>
              <Label text="Nomor HP aktif" required />
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                {...register("no_hp")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.no_hp && <p className="mt-2 text-sm font-medium text-error">{errors.no_hp.message}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-5 font-headline text-2xl font-bold text-on-surface">
            Alamat domisili
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label text="Alamat domisili lengkap" required />
              <textarea
                rows={4}
                placeholder="Tuliskan alamat domisili dengan jelas"
                {...register("alamat_domisili")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.alamat_domisili && <p className="mt-2 text-sm font-medium text-error">{errors.alamat_domisili.message}</p>}
            </div>

            <div>
              <Label text="Desa / Kelurahan" required />
              <input
                type="text"
                placeholder="Contoh: Sukamaju"
                {...register("desa")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.desa && <p className="mt-2 text-sm font-medium text-error">{errors.desa.message}</p>}
            </div>

            <div>
              <Label text="Kecamatan" required />
              <input
                type="text"
                placeholder="Contoh: Antapani"
                {...register("kecamatan")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.kecamatan && <p className="mt-2 text-sm font-medium text-error">{errors.kecamatan.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label text="Kabupaten / Kota" required />
              <input
                type="text"
                placeholder="Contoh: Kota Bandung"
                {...register("kabupaten")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.kabupaten && <p className="mt-2 text-sm font-medium text-error">{errors.kabupaten.message}</p>}
            </div>
          </div>
        </section>

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
                Lanjut ke data lahan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}