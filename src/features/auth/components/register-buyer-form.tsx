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

function Label({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-bold text-on-surface">
      {text}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
}

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
      <div className="rounded-2xl bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
        Kolom dengan tanda <span className="font-bold text-error">*</span> wajib diisi.
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label text="Nama akun" required />
          <input
            type="text"
            placeholder="Contoh: Budi Santoso"
            {...register("name")}
            className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-2 text-sm font-medium text-error">{errors.name.message}</p>}
        </div>

        <div>
          <Label text="Nama lengkap" required />
          <input
            type="text"
            placeholder="Contoh: Budi Santoso"
            {...register("full_name")}
            className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.full_name && <p className="mt-2 text-sm font-medium text-error">{errors.full_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label text="Username" required />
          <input
            type="text"
            placeholder="Contoh: budisantoso"
            {...register("username")}
            className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.username && <p className="mt-2 text-sm font-medium text-error">{errors.username.message}</p>}
        </div>

        <div>
          <Label text="Email" required />
          <input
            type="email"
            placeholder="contoh@email.com"
            {...register("email")}
            className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.email && <p className="mt-2 text-sm font-medium text-error">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <Label text="Nomor HP" />
        <input
          type="tel"
          placeholder="08123456789"
          {...register("phone")}
          className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {errors.phone && <p className="mt-2 text-sm font-medium text-error">{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          {errors.password && <p className="mt-2 text-sm font-medium text-error">{errors.password.message}</p>}
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
          {errors.password_confirmation && <p className="mt-2 text-sm font-medium text-error">{errors.password_confirmation.message}</p>}
        </div>
      </div>

      <label className="flex items-start gap-3 py-2">
        <input
          type="checkbox"
          {...register("terms")}
          className="mt-1 h-5 w-5 rounded-md border-surface-container-highest text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium leading-relaxed text-on-surface-variant">
          Saya setuju dengan <Link href="#" className="font-bold text-primary hover:underline">syarat layanan</Link> dan <Link href="#" className="font-bold text-primary hover:underline">kebijakan privasi</Link>.
        </span>
      </label>

      {errors.terms && <p className="text-sm font-medium text-error">{errors.terms.message}</p>}

      {formError && (
        <div className="rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-on-primary shadow-lg transition hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Membuat akun...
          </>
        ) : (
          "Buat akun buyer"
        )}
      </button>
    </form>
  );
}