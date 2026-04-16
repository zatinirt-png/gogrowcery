"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerBuyer } from "@/features/auth/api";
import {
  buyerRegisterSchema,
  type BuyerRegisterFormValues,
} from "@/features/auth/schema";
import {
  getAuthErrorMessage,
  getValidationErrors,
} from "@/features/auth/utils";

export default function RegisterBuyerForm() {
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
  } = useForm<BuyerRegisterFormValues>({
    resolver: zodResolver(buyerRegisterSchema),
    defaultValues: {
      name: "",
      full_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      terms: false,
    },
  });

  const onSubmit = async (values: BuyerRegisterFormValues) => {
    setFormError(null);

    try {
      await registerBuyer({
        name: values.name,
        full_name: values.full_name,
        username: values.username,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      toast.success("Registrasi buyer berhasil. Silakan login.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      const validationErrors = getValidationErrors(error);

      if (validationErrors.name) {
        setError("name", { type: "server", message: validationErrors.name });
      }
      if (validationErrors.full_name) {
        setError("full_name", {
          type: "server",
          message: validationErrors.full_name,
        });
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
      if (validationErrors.phone) {
        setError("phone", { type: "server", message: validationErrors.phone });
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Account Name
          </label>
          <input
            type="text"
            placeholder="Budi Santoso"
            {...register("name")}
            className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 outline-none transition placeholder:text-surface-dim focus:border-primary"
          />
          {errors.name && (
            <p className="text-sm font-medium text-error">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Budi Santoso"
            {...register("full_name")}
            className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 outline-none transition placeholder:text-surface-dim focus:border-primary"
          />
          {errors.full_name && (
            <p className="text-sm font-medium text-error">
              {errors.full_name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Username
          </label>
          <input
            type="text"
            placeholder="budisantoso"
            {...register("username")}
            className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 outline-none transition placeholder:text-surface-dim focus:border-primary"
          />
          {errors.username && (
            <p className="text-sm font-medium text-error">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Email
          </label>
          <input
            type="email"
            placeholder="budi@gmail.com"
            {...register("email")}
            className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 outline-none transition placeholder:text-surface-dim focus:border-primary"
          />
          {errors.email && (
            <p className="text-sm font-medium text-error">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Phone
        </label>
        <input
          type="tel"
          placeholder="08123456789"
          {...register("phone")}
          className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 outline-none transition placeholder:text-surface-dim focus:border-primary"
        />
        {errors.phone && (
          <p className="text-sm font-medium text-error">{errors.phone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 pr-10 outline-none transition placeholder:text-surface-dim focus:border-primary"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant"
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
              className="w-full border-0 border-b-2 border-surface-container-highest bg-transparent px-0 py-3 pr-10 outline-none transition placeholder:text-surface-dim focus:border-primary"
            />

            <button
              type="button"
              onClick={() => setShowPasswordConfirmation((prev) => !prev)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant"
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
      </div>

      <label className="flex items-start gap-3 py-2">
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

      <div className="space-y-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-on-primary shadow-lg transition hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-center text-sm font-semibold text-primary/80">
          Payload buyer sekarang mengikuti acuan Postman production.
        </p>
      </div>
    </form>
  );
}