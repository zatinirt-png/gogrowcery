"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepOneSchema,
  type SupplierAdminStepOneValues,
} from "@/features/auth/schema";

const DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

type SupplierAdminDraft = {
  step1?: SupplierAdminStepOneValues;
  updatedAt?: string;
};

export default function RegisterSupplierAdminStepOneForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierAdminStepOneValues>({
    resolver: zodResolver(supplierAdminStepOneSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      if (!parsed.step1) return;

      setValue("name", parsed.step1.name ?? "");
      setValue("username", parsed.step1.username ?? "");
      setValue("email", parsed.step1.email ?? "");
      setValue("password", parsed.step1.password ?? "");
      setValue(
        "password_confirmation",
        parsed.step1.password_confirmation ?? ""
      );
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  const onSubmit = async (values: SupplierAdminStepOneValues) => {
    const draft: SupplierAdminDraft = {
      step1: values,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    toast.success("Step 1 saved. Lanjut ke Step 2.");
    router.push("/register/supplier/admin/step-2");
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest p-10 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jonathan Thorne"
              {...register("name")}
              className="w-full rounded-xl border-none bg-surface-container-low px-4 py-4 text-on-surface placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-fixed-dim"
            />
            {errors.name && (
              <p className="text-sm font-medium text-error">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Username
            </label>
            <input
              type="text"
              placeholder="jthorne_harvest"
              {...register("username")}
              className="w-full rounded-xl border-none bg-surface-container-low px-4 py-4 text-on-surface placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-fixed-dim"
            />
            {errors.username && (
              <p className="text-sm font-medium text-error">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Email Address (optional)
            </label>
            <input
              type="email"
              placeholder="jonathan@thornefarms.com"
              {...register("email")}
              className="w-full rounded-xl border-none bg-surface-container-low px-4 py-4 text-on-surface placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-fixed-dim"
            />
            {errors.email && (
              <p className="text-sm font-medium text-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Secure Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                {...register("password")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-4 pr-12 text-on-surface placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-fixed-dim"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm font-medium text-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="••••••••••••"
                {...register("password_confirmation")}
                className="w-full rounded-xl border-none bg-surface-container-low px-4 py-4 pr-12 text-on-surface placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-fixed-dim"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswordConfirmation((prev) => !prev)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPasswordConfirmation ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm font-medium text-error">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-surface-container pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="h-2 w-12 rounded-full bg-primary" />
            <div className="h-2 w-4 rounded-full bg-surface-container-highest" />
            <div className="h-2 w-4 rounded-full bg-surface-container-highest" />
            <div className="h-2 w-4 rounded-full bg-surface-container-highest" />
            <div className="h-2 w-4 rounded-full bg-surface-container-highest" />
            <span className="ml-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              20% Complete
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="signature-gradient flex items-center gap-2 rounded-xl px-10 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span>Continue to Step 2</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}