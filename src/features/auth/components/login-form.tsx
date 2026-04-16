"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/features/auth/api";
import { persistAuthSession } from "@/features/auth/storage";
import { loginSchema, type LoginFormValues } from "@/features/auth/schema";
import {
  getAuthErrorMessage,
  getValidationErrors,
} from "@/features/auth/utils";
import { getRoleRedirectPath } from "@/lib/role-redirect";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      const response = await login({
        username: values.username,
        password: values.password,
      });

      persistAuthSession(response.token, response.user.role, {
        remember: Boolean(values.remember),
      });

      toast.success(response.message || "Login berhasil");
      router.replace(getRoleRedirectPath(response.user.role));
      router.refresh();
    } catch (error) {
      const validationErrors = getValidationErrors(error);

      if (validationErrors.username) {
        setError("username", {
          type: "server",
          message: validationErrors.username,
        });
      }

      if (validationErrors.password) {
        setError("password", {
          type: "server",
          message: validationErrors.password,
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
        <label
          htmlFor="username"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
        >
          Username
        </label>

        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="superadmin"
            {...register("username")}
            className="w-full rounded-xl border border-transparent bg-surface-container-low px-4 py-3.5 pl-11 outline-none transition placeholder:text-outline focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/30"
          />
        </div>

        {errors.username && (
          <p className="text-sm font-medium text-error">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
        <label className="inline-flex items-center gap-3 text-sm font-medium text-on-surface-variant">
          <input
            type="checkbox"
            {...register("remember")}
            className="h-4 w-4 rounded border-surface-container-highest text-primary focus:ring-primary"
          />
          Remember me
        </label>

        <Link
          href="/register"
          className="text-sm font-semibold text-primary transition hover:underline"
        >
          Need an account?
        </Link>
      </div>

      {formError && (
        <div className="rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}