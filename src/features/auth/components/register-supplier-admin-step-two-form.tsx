"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepTwoSchema,
  type SupplierAdminStepTwoValues,
} from "@/features/auth/schema";

const DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: SupplierAdminStepTwoValues;
  updatedAt?: string;
};

const languageOptions = ["Indonesia", "Sunda", "Jawa", "Inggris"];

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
      status_perkawinan: "",
      no_hp: "",
      alamat_domisili: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
      bahasa_komunikasi: [],
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
      setValue("status_perkawinan", parsed.step2.status_perkawinan ?? "");
      setValue("no_hp", parsed.step2.no_hp ?? "");
      setValue("alamat_domisili", parsed.step2.alamat_domisili ?? "");
      setValue("desa", parsed.step2.desa ?? "");
      setValue("kecamatan", parsed.step2.kecamatan ?? "");
      setValue("kabupaten", parsed.step2.kabupaten ?? "");
      setValue(
        "bahasa_komunikasi",
        parsed.step2.bahasa_komunikasi ?? []
      );
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  const saveDraft = (values: SupplierAdminStepTwoValues) => {
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
      step2: values,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
  };

  const handleSaveAndExit = () => {
    saveDraft(getValues());
    toast.success("Draft step 2 berhasil disimpan.");
    router.push("/register/supplier");
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push("/register/supplier/admin");
  };

  const onSubmit = async (values: SupplierAdminStepTwoValues) => {
    saveDraft(values);
    toast.success("Step 2 saved. Lanjut ke Step 3.");
    router.push("/register/supplier/admin/step-3");
  };

  return (
    <div className="mb-8 rounded-xl bg-surface-container-lowest p-8 shadow-[0_4px_24px_rgba(25,28,30,0.04)]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Identity Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">
                Full Name (as per ID)
              </label>
              <input
                type="text"
                placeholder="e.g. Budi Santoso"
                {...register("nama_lengkap")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.nama_lengkap && (
                <p className="text-sm font-medium text-error">
                  {errors.nama_lengkap.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">
                National ID Number (NIK)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="16-digit identification number"
                {...register("no_ktp")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.no_ktp && (
                <p className="text-sm font-medium text-error">
                  {errors.no_ktp.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">
                Birth Place &amp; Date
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  {...register("tempat_lahir")}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
                <input
                  type="date"
                  {...register("tanggal_lahir")}
                  className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                />
              </div>
              {(errors.tempat_lahir || errors.tanggal_lahir) && (
                <p className="text-sm font-medium text-error">
                  {errors.tempat_lahir?.message || errors.tanggal_lahir?.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Gender
                </label>
                <select
                  {...register("jenis_kelamin")}
                  className="w-full appearance-none rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                >
                  <option value="">Select</option>
                  <option value="laki_laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
                {errors.jenis_kelamin && (
                  <p className="text-sm font-medium text-error">
                    {errors.jenis_kelamin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Marital Status
                </label>
                <select
                  {...register("status_perkawinan")}
                  className="w-full appearance-none rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                >
                  <option value="">Select</option>
                  <option value="belum_kawin">Belum Kawin</option>
                  <option value="kawin">Kawin</option>
                  <option value="cerai_hidup">Cerai Hidup</option>
                  <option value="cerai_mati">Cerai Mati</option>
                </select>
                {errors.status_perkawinan && (
                  <p className="text-sm font-medium text-error">
                    {errors.status_perkawinan.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Contact &amp; Domicile
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-bold text-on-surface-variant">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="08123456789"
                {...register("no_hp")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.no_hp && (
                <p className="text-sm font-medium text-error">
                  {errors.no_hp.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant">
              Domicile Address
            </label>
            <textarea
              rows={2}
              placeholder="Full residential address..."
              {...register("alamat_domisili")}
              className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
            />
            {errors.alamat_domisili && (
              <p className="text-sm font-medium text-error">
                {errors.alamat_domisili.message}
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Village"
                {...register("desa")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.desa && (
                <p className="text-sm font-medium text-error">
                  {errors.desa.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="District"
                {...register("kecamatan")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.kecamatan && (
                <p className="text-sm font-medium text-error">
                  {errors.kecamatan.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Regency"
                {...register("kabupaten")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              {errors.kabupaten && (
                <p className="text-sm font-medium text-error">
                  {errors.kabupaten.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Communication Languages
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {languageOptions.map((language) => (
              <label
                key={language}
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low p-3 transition-colors hover:bg-surface-container-high"
              >
                <input
                  type="checkbox"
                  value={language}
                  {...register("bahasa_komunikasi")}
                  className="h-5 w-5 rounded border-none text-primary focus:ring-primary-fixed-dim"
                />
                <span className="text-sm font-medium text-on-surface">
                  {language}
                </span>
              </label>
            ))}
          </div>

          {errors.bahasa_komunikasi && (
            <p className="mt-3 text-sm font-medium text-error">
              {errors.bahasa_komunikasi.message}
            </p>
          )}
        </section>

        <div className="flex items-center justify-between border-t border-surface-container-high pt-8">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl px-8 py-3 font-bold text-secondary transition-all hover:bg-surface-container-high active:scale-95"
          >
            Back to Step 1
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="hidden rounded-xl bg-secondary-container/50 px-8 py-3 font-bold text-on-secondary-container transition-all hover:bg-secondary-container active:scale-95 md:block"
            >
              Save &amp; Exit
            </button>

            <button
            type="submit"
            disabled={isSubmitting}
            className="signature-gradient flex items-center gap-2 rounded-xl px-10 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next Step: Land Records
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}