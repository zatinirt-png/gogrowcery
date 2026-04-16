"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Smartphone,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepFourSchema,
  type SupplierAdminStepFourValues,
} from "@/features/auth/schema";

const DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: Record<string, unknown>;
  step3?: Record<string, unknown>;
  step4?: SupplierAdminStepFourValues;
  updatedAt?: string;
};

export default function RegisterSupplierAdminStepFourForm() {
  const router = useRouter();
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SupplierAdminStepFourValues>({
    resolver: zodResolver(supplierAdminStepFourSchema),
    defaultValues: {
      payout_method: "transfer",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
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
      setValue(
        "bank_account_number",
        parsed.step4.bank_account_number ?? ""
      );
      setValue("bank_account_name", parsed.step4.bank_account_name ?? "");
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  const saveDraft = (values: SupplierAdminStepFourValues) => {
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
      step4: values,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push("/register/supplier/admin/step-3");
  };

  const handleSaveDraft = () => {
    saveDraft(getValues());
    toast.success("Draft step 4 berhasil disimpan.");
  };

  const onSubmit = async (values: SupplierAdminStepFourValues) => {
    saveDraft(values);
    toast.success("Step 4 saved. Lanjut ke Review.");
    router.push("/register/supplier/admin/step-5");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-8 items-start">
      <div className="col-span-12 space-y-6 lg:col-span-7">
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
            <Banknote className="h-5 w-5 text-primary" />
            Select Payout Method
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                value="transfer"
                {...register("payout_method")}
                className="peer hidden"
              />
              <div className="rounded-xl border-2 border-surface-container-high bg-surface-container-low p-5 transition-all peer-checked:border-primary peer-checked:bg-primary-container/5 hover:border-primary/50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      Bank Transfer
                    </p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      Recommended for large sums
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative cursor-pointer">
              <input
                type="radio"
                value="ewallet"
                {...register("payout_method")}
                className="peer hidden"
              />
              <div className="rounded-xl border-2 border-surface-container-high bg-surface-container-low p-5 transition-all peer-checked:border-primary peer-checked:bg-primary-container/5 hover:border-primary/50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      E-wallet
                    </p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      Instant mobile settlements
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {errors.payout_method && (
            <p className="mt-4 text-sm font-medium text-error">
              {errors.payout_method.message}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-bold">Banking Details</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Lock className="h-4 w-4" />
              Encrypted
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-tighter text-on-surface-variant/80">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="Full legal name"
                {...register("bank_account_name")}
                className="w-full rounded-xl border-0 bg-surface-container-low px-4 py-3 text-sm font-medium transition-shadow focus:ring-2 focus:ring-primary-container"
              />
              {errors.bank_account_name && (
                <p className="text-sm font-medium text-error">
                  {errors.bank_account_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-tighter text-on-surface-variant/80">
                Institution Name
              </label>

              <select
                {...register("bank_name")}
                className="w-full appearance-none rounded-xl border-0 bg-surface-container-low px-4 py-3 text-sm font-medium transition-shadow focus:ring-2 focus:ring-primary-container"
              >
                <option value="">
                  {payoutMethod === "ewallet"
                    ? "Select e-wallet provider"
                    : "Select bank"}
                </option>

                {payoutMethod === "ewallet" ? (
                  <>
                    <option value="gopay">GoPay</option>
                    <option value="ovo">OVO</option>
                    <option value="dana">DANA</option>
                    <option value="shopeepay">ShopeePay</option>
                  </>
                ) : (
                  <>
                    <option value="bca">BCA</option>
                    <option value="bri">BRI</option>
                    <option value="bni">BNI</option>
                    <option value="mandiri">Mandiri</option>
                  </>
                )}
              </select>

              {errors.bank_name && (
                <p className="text-sm font-medium text-error">
                  {errors.bank_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-tighter text-on-surface-variant/80">
                {payoutMethod === "ewallet"
                  ? "E-wallet Number"
                  : "Account Number"}
              </label>

              <div className="relative">
                <input
                  type={showAccountNumber ? "text" : "password"}
                  placeholder={
                    payoutMethod === "ewallet"
                      ? "Enter registered mobile number"
                      : "Enter account number"
                  }
                  {...register("bank_account_number")}
                  className="w-full rounded-xl border-0 bg-surface-container-low px-4 py-3 pr-12 text-sm font-medium transition-shadow focus:ring-2 focus:ring-primary-container"
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40"
                >
                  {showAccountNumber ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.bank_account_number && (
                <p className="text-sm font-medium text-error">
                  {errors.bank_account_number.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            ← Go Back
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-xl bg-surface-container-high px-8 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            >
              Save Draft
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="signature-gradient flex items-center gap-2 rounded-xl px-12 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Confirm and Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-5">
        <div className="rounded-xl border-l-4 border-primary bg-surface-container p-6 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary">
            Next Projected Payout
          </p>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold text-on-surface">
              $12,450.00
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              Estimated
            </span>
          </div>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Based on your currently registered inventory of{" "}
            <span className="font-bold text-on-surface">
              premium arabica beans
            </span>
            .
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-black/5">
          <div className="absolute -bottom-10 -right-10 opacity-5">
            <Lock className="h-32 w-32" />
          </div>

          <h4 className="mb-4 text-sm font-bold">The Precision Standard</h4>

          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">
                  Bank-Grade Encryption
                </p>
                <p className="mt-0.5 text-[10px] leading-normal text-on-surface-variant">
                  Your financial data is protected before the final registration
                  payload is submitted.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">
                  T+2 Settlement Cycle
                </p>
                <p className="mt-0.5 text-[10px] leading-normal text-on-surface-variant">
                  Fast-track payments for verified suppliers after operational
                  verification.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-4 rounded-xl bg-primary/5 p-6">
          <div className="text-primary">💡</div>
          <div>
            <p className="mb-1 text-xs font-bold text-primary">
              Need help with regional codes?
            </p>
            <p className="text-[10px] leading-normal text-on-surface-variant">
              You can continue with bank or e-wallet selection now, then refine
              operational payout validation at review.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}