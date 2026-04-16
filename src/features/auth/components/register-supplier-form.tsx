"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerSupplier } from "@/features/auth/api";
import {
  supplierRegisterSchema,
  type SupplierRegisterFormValues,
} from "@/features/auth/schema";
import {
  getAuthErrorMessage,
  getValidationErrors,
} from "@/features/auth/utils";

export default function RegisterSupplierForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SupplierRegisterFormValues>({
    resolver: zodResolver(supplierRegisterSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      password_confirmation: "",
      terms: false,
    },
  });

  const onSubmit = async (values: SupplierRegisterFormValues) => {
    setFormError(null);

    try {
      await registerSupplier({
        name: values.name,
        username: values.username,
        email: values.email?.trim() ? values.email.trim() : null,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      toast.success("Registrasi supplier berhasil. Silakan login.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      const validationErrors = getValidationErrors(error);

      if (validationErrors.name) {
        setError("name", { type: "server", message: validationErrors.name });
      }
      if (validationErrors.username) {
        setError("username", {
          type: "server",
          message: validationErrors.username,
        });
      }
      if (validationErrors.email) {
        setError("email", { type: "server", message: validationErrors.email });
      }
      if (validationErrors.password) {
        setError("password", {
          type: "server",
          message: validationErrors.password,
        });
      }
      if (validationErrors.password_confirmation) {
        setError("password_confirmation", {
          type: "server",
          message: validationErrors.password_confirmation,
        });
      }

      const message = getAuthErrorMessage(error);
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Account Name
        </label>
        <input
          type="text"
          placeholder="Budi Tani"
          {...register("name")}
          className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
        />
        {errors.name && (
          <p className="text-sm font-medium text-error">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Username
        </label>
        <input
          type="text"
          placeholder="buditani"
          {...register("username")}
          className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
        />
        {errors.username && (
          <p className="text-sm font-medium text-error">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Email (optional)
        </label>
        <input
          type="email"
          placeholder="supplier@example.com"
          {...register("email")}
          className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
        />
        {errors.email && (
          <p className="text-sm font-medium text-error">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Password
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 pr-12 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {errors.password && (
          <p className="text-sm font-medium text-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Confirm Password
        </label>

        <div className="relative">
          <input
            type={showPasswordConfirmation ? "text" : "password"}
            placeholder="••••••••"
            {...register("password_confirmation")}
            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 pr-12 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"
          >
            {showPasswordConfirmation ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {errors.password_confirmation && (
          <p className="text-sm font-medium text-error">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          {...register("terms")}
          className="mt-1 h-5 w-5 rounded-md border-surface-container-highest text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium leading-relaxed text-on-surface-variant">
          I agree to the{" "}
          <Link href="#" className="font-bold text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-bold text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {errors.terms && (
        <p className="text-sm font-medium text-error">{errors.terms.message}</p>
      )}

      {formError && (
        <div className="rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {formError}
        </div>
      )}

      <div className="rounded-xl bg-primary/5 p-4 text-sm leading-7 text-on-surface-variant">
        Endpoint supplier public tetap mengarah ke <code>/api/auth/register/supplier</code>.
        Namun collection Postman production menunjukkan payload supplier lengkap.
        Jadi untuk onboarding penuh, gunakan jalur admin multi-step di sebelah ini.
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Apply to Network"
        )}
      </button>
    </form>
  );
}