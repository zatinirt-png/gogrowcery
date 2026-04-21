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
import {
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;

type SupplierAdminDraft = {
  step1?: SupplierAdminStepOneValues;
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
    toast.success("Data akun tersimpan.");
    router.push(supplierGuidedRoutes.step2);
  };

  return (
    <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-8 rounded-2xl bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
        Kolom dengan tanda <span className="font-bold text-error">*</span> wajib diisi.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label text="Nama akun" required />
            <input
              type="text"
              placeholder="Contoh: Budi Tani"
              {...register("name")}
              className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.name && (
              <p className="mt-2 text-sm font-medium text-error">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label text="Username" required />
            <input
              type="text"
              placeholder="Contoh: buditani"
              {...register("username")}
              className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.username && (
              <p className="mt-2 text-sm font-medium text-error">{errors.username.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label text="Email aktif" />
            <input
              type="email"
              placeholder="contoh@email.com"
              {...register("email")}
              className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-sm text-on-surface-variant">Opsional, tetapi disarankan agar komunikasi lebih mudah.</p>
            {errors.email && (
              <p className="mt-2 text-sm font-medium text-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label text="Kata sandi" required />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                {...register("password")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm font-medium text-error">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label text="Konfirmasi kata sandi" required />
            <div className="relative">
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                {...register("password_confirmation")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >
                {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="mt-2 text-sm font-medium text-error">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-outline-variant/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">Langkah 1 dari 5</p>

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
                Lanjut ke data diri
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}