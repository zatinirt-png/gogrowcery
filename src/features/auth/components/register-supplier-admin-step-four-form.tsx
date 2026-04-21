"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepFourSchema,
  type SupplierAdminStepFourValues,
} from "@/features/auth/schema";
import {
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: Record<string, unknown>;
  step3?: Record<string, unknown>;
  step4?: SupplierAdminStepFourValues;
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

export default function RegisterSupplierAdminStepFourForm() {
  const router = useRouter();

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SupplierAdminStepFourValues>({
    resolver: zodResolver(supplierAdminStepFourSchema),
    defaultValues: {
      payout_method: "transfer",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
      ewallet_name: "",
      ewallet_account_number: "",
      ewallet_account_name: "",
    },
  });

  const payoutMethod = watch("payout_method");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      if (!parsed.step4) return;

      setValue("payout_method", parsed.step4.payout_method ?? "transfer");
      setValue("bank_name", parsed.step4.bank_name ?? "");
      setValue("bank_account_number", parsed.step4.bank_account_number ?? "");
      setValue("bank_account_name", parsed.step4.bank_account_name ?? "");
      setValue("ewallet_name", parsed.step4.ewallet_name ?? "");
      setValue(
        "ewallet_account_number",
        parsed.step4.ewallet_account_number ?? ""
      );
      setValue("ewallet_account_name", parsed.step4.ewallet_account_name ?? "");
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  const saveDraft = (values: SupplierAdminStepFourValues) => {
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
        step4: values,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push(supplierGuidedRoutes.step3);
  };

  const onSubmit = async (values: SupplierAdminStepFourValues) => {
    saveDraft(values);
    toast.success("Data pencairan tersimpan.");
    router.push(supplierGuidedRoutes.step5);
  };

  return (
    <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-8 rounded-2xl bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
        Nomor rekening atau nomor e-wallet tidak lagi ditampilkan sebagai field password. Data tetap bisa ditinjau lagi di langkah berikutnya.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section>
          <Label text="Metode pencairan" required />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
              <input type="radio" value="transfer" {...register("payout_method")} className="mt-1" />
              <div>
                <p className="font-bold text-on-surface">Transfer bank</p>
                <p className="mt-1 text-sm leading-7 text-on-surface-variant">Gunakan rekening bank untuk pencairan dana.</p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
              <input type="radio" value="ewallet" {...register("payout_method")} className="mt-1" />
              <div>
                <p className="font-bold text-on-surface">E-wallet</p>
                <p className="mt-1 text-sm leading-7 text-on-surface-variant">Gunakan akun e-wallet untuk pencairan dana.</p>
              </div>
            </label>
          </div>
          {errors.payout_method && <p className="mt-2 text-sm font-medium text-error">{errors.payout_method.message}</p>}
        </section>

        {payoutMethod === "transfer" ? (
          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <Label text="Nama pemilik rekening" required />
              <input
                type="text"
                placeholder="Sesuai nama rekening"
                {...register("bank_account_name")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.bank_account_name && <p className="mt-2 text-sm font-medium text-error">{errors.bank_account_name.message}</p>}
            </div>

            <div>
              <Label text="Nama bank" required />
              <select
                {...register("bank_name")}
                className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih bank</option>
                <option value="BCA">BCA</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="Mandiri">Mandiri</option>
              </select>
              {errors.bank_name && <p className="mt-2 text-sm font-medium text-error">{errors.bank_name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label text="Nomor rekening" required />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Masukkan nomor rekening"
                {...register("bank_account_number")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.bank_account_number && <p className="mt-2 text-sm font-medium text-error">{errors.bank_account_number.message}</p>}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <Label text="Nama pemilik akun e-wallet" required />
              <input
                type="text"
                placeholder="Sesuai nama akun"
                {...register("ewallet_account_name")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.ewallet_account_name && <p className="mt-2 text-sm font-medium text-error">{errors.ewallet_account_name.message}</p>}
            </div>

            <div>
              <Label text="Nama e-wallet" required />
              <select
                {...register("ewallet_name")}
                className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih e-wallet</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="DANA">DANA</option>
                <option value="ShopeePay">ShopeePay</option>
              </select>
              {errors.ewallet_name && <p className="mt-2 text-sm font-medium text-error">{errors.ewallet_name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Label text="Nomor e-wallet" required />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Masukkan nomor e-wallet"
                {...register("ewallet_account_number")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.ewallet_account_number && <p className="mt-2 text-sm font-medium text-error">{errors.ewallet_account_number.message}</p>}
            </div>
          </section>
        )}

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
                Lanjut ke peninjauan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}