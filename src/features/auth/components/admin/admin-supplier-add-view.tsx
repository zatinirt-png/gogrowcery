"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  CircleDollarSign,
  LandPlot,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  UserPlus,
  Waypoints,
} from "lucide-react";
import { toast } from "sonner";
import { createAdminSupplier } from "@/features/auth/api";
import {
  adminCreateSupplierSchema,
  type AdminCreateSupplierFormValues,
} from "@/features/auth/schema";
import {
  getAuthErrorMessage,
  getValidationErrors,
} from "@/features/auth/utils";
import AdminShell from "./admin-shell";

const DRAFT_KEY = "admin-supplier-add-draft-v1";

const jenisKelaminOptions = [
  { value: "laki_laki", label: "Laki-laki" },
  { value: "perempuan", label: "Perempuan" },
];


const kepemilikanOptions = [
  { value: "milik_sendiri", label: "Milik Sendiri" },
  { value: "sewa", label: "Sewa" },
  { value: "bagi_hasil", label: "Bagi Hasil" },
  { value: "lainnya", label: "Lainnya" },
];

const statusAktifOptions = [
  { value: "aktif", label: "Aktif" },
  { value: "tidak_aktif", label: "Tidak Aktif" },
];

const payoutMethodOptions = [
  { value: "transfer", label: "Bank Transfer" },
  { value: "ewallet", label: "E-wallet" },
];

function createDefaultValues(): AdminCreateSupplierFormValues {
  return {
    name: "",
    email: "",
    nama_lengkap: "",
    no_ktp: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "laki_laki",
    no_hp: "",
    alamat_domisili: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    lands: [
      {
        nama_lahan: "",
        nama_pemilik: "",
        no_hp: "",
        alamat_lahan: "",
        desa: "",
        kecamatan: "",
        kabupaten: "",
        provinsi: "",
        kepemilikan: "milik_sendiri",
        luas_lahan_m2: 0,
        status_aktif: "aktif",
      },
    ],
    payout: {
      payout_method: "transfer",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
      ewallet_name: "",
      ewallet_account_number: "",
      ewallet_account_name: "",
    },
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-error">{message}</p>;
}

export default function AdminSupplierAddView() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateSupplierFormValues>({
    resolver: zodResolver(adminCreateSupplierSchema),
    defaultValues: createDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lands",
  });

  const payoutMethod = watch("payout.payout_method");

  const sectionLinks = useMemo(
    () => [
      { href: "#account-info", label: "Account Info", active: true },
      { href: "#personal-info", label: "Personal Details", active: false },
      { href: "#land-info", label: "Land Records", active: false },
      { href: "#payout-info", label: "Payout Info", active: false },
    ],
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawDraft = window.localStorage.getItem(DRAFT_KEY);
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft) as Partial<AdminCreateSupplierFormValues>;
      const defaults = createDefaultValues();

      reset({
        ...defaults,
        ...parsed,
        lands:
          parsed.lands && parsed.lands.length > 0 ? parsed.lands : defaults.lands,
        payout: {
          ...defaults.payout,
          ...parsed.payout,
        },
      });

      toast.success("Draft admin supplier dimuat dari browser.");
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [reset]);

  const handleSaveDraft = () => {
    if (typeof window === "undefined") return;

    const values = getValues();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    toast.success("Draft disimpan di browser.");
  };

  const applyServerValidationErrors = (validationErrors: Record<string, string>) => {
    Object.entries(validationErrors).forEach(([field, message]) => {
      setError(field as never, {
        type: "server",
        message,
      });
    });
  };

  const buildPayload = (values: AdminCreateSupplierFormValues) => ({
    name: values.name.trim(),
    email: values.email?.trim() ? values.email.trim() : null,
    nama_lengkap: values.nama_lengkap.trim(),
    no_ktp: values.no_ktp.trim(),
    tempat_lahir: values.tempat_lahir.trim(),
    tanggal_lahir: values.tanggal_lahir,
    jenis_kelamin: values.jenis_kelamin,
    no_hp: values.no_hp.trim(),
    alamat_domisili: values.alamat_domisili.trim(),
    desa: values.desa.trim(),
    kecamatan: values.kecamatan.trim(),
    kabupaten: values.kabupaten.trim(),
    lands: values.lands.map((land) => ({
      nama_lahan: land.nama_lahan.trim(),
      nama_pemilik: land.nama_pemilik.trim(),
      no_hp: land.no_hp.trim(),
      alamat_lahan: land.alamat_lahan.trim(),
      desa: land.desa.trim(),
      kecamatan: land.kecamatan.trim(),
      kabupaten: land.kabupaten.trim(),
      provinsi: land.provinsi.trim(),
      kepemilikan: land.kepemilikan,
      luas_lahan_m2: Number(land.luas_lahan_m2),
      status_aktif: land.status_aktif,
    })),
    payout:
      values.payout.payout_method === "transfer"
        ? {
            payout_method: "transfer",
            bank_name: values.payout.bank_name?.trim() || "",
            bank_account_number:
              values.payout.bank_account_number?.trim() || "",
            bank_account_name:
              values.payout.bank_account_name?.trim() || "",
          }
        : {
            payout_method: "ewallet",
            ewallet_name: values.payout.ewallet_name?.trim() || "",
            ewallet_account_number:
              values.payout.ewallet_account_number?.trim() || "",
            ewallet_account_name:
              values.payout.ewallet_account_name?.trim() || "",
          },
  });

  const onSubmit = async (values: AdminCreateSupplierFormValues) => {
    setFormError(null);

    try {
      const response = await createAdminSupplier(buildPayload(values));

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }

      toast.success(response.message || "Supplier berhasil ditambahkan");
      reset(createDefaultValues());
    } catch (error) {
      const validationErrors = getValidationErrors(error);
      applyServerValidationErrors(validationErrors);

      const message = getAuthErrorMessage(error);
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <AdminShell
      title="Add Supplier"
      description="Form admin ini live. Save Draft menyimpan ke browser, sedangkan Finalize Entry akan POST ke endpoint admin supplier."
      actions={
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-end">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 md:w-auto"
        >
          <Save className="h-4 w-4 shrink-0" />
          Save Draft
        </button>

        <button
          type="submit"
          form="admin-supplier-form"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-70 md:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <Send className="h-4 w-4 shrink-0" />
          )}
          Finalize Entry
        </button>
      </div>
    }
    >
      <form
        id="admin-supplier-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
      >
        <aside className="h-fit rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            Form Sections
          </p>

          <div className="mt-4 grid gap-2">
            {sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={
                  item.active
                    ? "rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm"
                    : "rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                }
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
            <p className="text-sm font-bold text-on-surface">Payload Status</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Finalize Entry akan mengirim payload admin supplier: biodata,
              lands[], dan payout transfer / ewallet.
            </p>
          </div>

          {formError ? (
            <div className="mt-4 rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">
              {formError}
            </div>
          ) : null}
        </aside>

        <div className="grid gap-6">
          <section
            id="account-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Section 1
                </p>
                <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                  Account Info
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Supplier Name
                </label>
                <input
                  type="text"
                  placeholder="Tani Jaya"
                  {...register("name")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  {...register("email")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.email?.message} />
              </div>
            </div>
          </section>

          <section
            id="personal-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-secondary-container/40 p-3 text-secondary">
                <Waypoints className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Section 2
                </p>
                <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                  Personal Details
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Siti Rahayu"
                  {...register("nama_lengkap")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.nama_lengkap?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  No KTP
                </label>
                <input
                  type="text"
                  placeholder="3271234567890002"
                  {...register("no_ktp")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.no_ktp?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  placeholder="Garut"
                  {...register("tempat_lahir")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.tempat_lahir?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  {...register("tanggal_lahir")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.tanggal_lahir?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Jenis Kelamin
                </label>
                <select
                  {...register("jenis_kelamin")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                >
                  {jenisKelaminOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.jenis_kelamin?.message} />
              </div>


              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  No HP
                </label>
                <input
                  type="text"
                  placeholder="08129999888"
                  {...register("no_hp")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.no_hp?.message} />
              </div>

              <div className="space-y-2 md:col-span-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Alamat Domisili
                </label>
                <textarea
                  rows={3}
                  placeholder="Jl. Sawah No. 3"
                  {...register("alamat_domisili")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.alamat_domisili?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Desa
                </label>
                <input
                  type="text"
                  placeholder="Sukamaju"
                  {...register("desa")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.desa?.message} />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Kecamatan
                </label>
                <input
                  type="text"
                  placeholder="Tarogong"
                  {...register("kecamatan")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.kecamatan?.message} />
              </div>

              <div className="space-y-2 min-w-0 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Kabupaten
                </label>
                <input
                  type="text"
                  placeholder="Garut"
                  {...register("kabupaten")}
                  className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
                <FieldError message={errors.kabupaten?.message} />
              </div>

            </div>
          </section>

          <section
            id="land-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <LandPlot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Section 3
                  </p>
                  <h2 className="mt-1 font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                    Land Records
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  append({
                    nama_lahan: "",
                    nama_pemilik: "",
                    no_hp: "",
                    alamat_lahan: "",
                    desa: "",
                    kecamatan: "",
                    kabupaten: "",
                    provinsi: "",
                    kepemilikan: "milik_sendiri",
                    luas_lahan_m2: 0,
                    status_aktif: "aktif",
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-lowest sm:w-auto"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Add Land
              </button>
            </div>

            <div className="mt-6 grid gap-6">
              {fields.map((field, index) => (
                <article
                  key={field.id}
                  className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4 sm:p-5"
                >
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Land Entry
                      </p>
                      <p className="mt-1 text-lg font-bold text-on-surface">
                        Lahan #{index + 1}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-sm font-bold text-on-surface transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Nama Lahan
                      </label>
                      <input
                        type="text"
                        placeholder="Sawah Selatan"
                        {...register(`lands.${index}.nama_lahan`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.nama_lahan?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Nama Pemilik
                      </label>
                      <input
                        type="text"
                        placeholder="Siti Rahayu"
                        {...register(`lands.${index}.nama_pemilik`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.nama_pemilik?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        No HP Lahan
                      </label>
                      <input
                        type="text"
                        placeholder="08129999888"
                        {...register(`lands.${index}.no_hp`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError message={errors.lands?.[index]?.no_hp?.message} />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Luas Lahan (m2)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="3000"
                        {...register(`lands.${index}.luas_lahan_m2`, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.luas_lahan_m2?.message}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Alamat Lahan
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Jl. Sawah Barat Blok C"
                        {...register(`lands.${index}.alamat_lahan`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.alamat_lahan?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Desa
                      </label>
                      <input
                        type="text"
                        placeholder="Sukamaju"
                        {...register(`lands.${index}.desa`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError message={errors.lands?.[index]?.desa?.message} />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Kecamatan
                      </label>
                      <input
                        type="text"
                        placeholder="Tarogong"
                        {...register(`lands.${index}.kecamatan`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.kecamatan?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Kabupaten
                      </label>
                      <input
                        type="text"
                        placeholder="Garut"
                        {...register(`lands.${index}.kabupaten`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.kabupaten?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Provinsi
                      </label>
                      <input
                        type="text"
                        placeholder="Jawa Barat"
                        {...register(`lands.${index}.provinsi`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      />
                      <FieldError
                        message={errors.lands?.[index]?.provinsi?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Kepemilikan
                      </label>
                      <select
                        {...register(`lands.${index}.kepemilikan`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      >
                        {kepemilikanOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        message={errors.lands?.[index]?.kepemilikan?.message}
                      />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Status Aktif
                      </label>
                      <select
                        {...register(`lands.${index}.status_aktif`)}
                        className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                      >
                        {statusAktifOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        message={errors.lands?.[index]?.status_aktif?.message}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="payout-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Section 4
                </p>
                <h2 className="mt-1 font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                  Payout Info
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Payout Method
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {payoutMethodOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        payoutMethod === option.value
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-outline-variant/15 bg-surface-container-low text-on-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register("payout.payout_method")}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="break-words">{option.label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.payout?.payout_method?.message} />
              </div>

              {payoutMethod === "transfer" ? (
                <>
                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="BCA"
                      {...register("payout.bank_name")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.payout?.bank_name?.message} />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      {...register("payout.bank_account_number")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError
                      message={errors.payout?.bank_account_number?.message}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      Bank Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="Siti Rahayu"
                      {...register("payout.bank_account_name")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError
                      message={errors.payout?.bank_account_name?.message}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      E-wallet Name
                    </label>
                    <input
                      type="text"
                      placeholder="GoPay"
                      {...register("payout.ewallet_name")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError message={errors.payout?.ewallet_name?.message} />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      E-wallet Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="08129999888"
                      {...register("payout.ewallet_account_number")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError
                      message={errors.payout?.ewallet_account_number?.message}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      E-wallet Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="Siti Rahayu"
                      {...register("payout.ewallet_account_name")}
                      className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-3 text-sm outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                    <FieldError
                      message={errors.payout?.ewallet_account_name?.message}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low disabled:opacity-70 sm:w-auto"
              >
                <Save className="h-4 w-4 shrink-0" />
                Save Draft
              </button>

              <Link
                href="/admin/suppliers/pending"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
              >
                Review Pending Queue
              </Link>
            </div>
          </section>
        </div>
      </form>
    </AdminShell>
  );
}