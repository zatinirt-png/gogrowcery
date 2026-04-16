"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Map,
  PencilLine,
  Send,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { registerSupplier } from "@/features/auth/api";

const DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

type Step1Draft = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
};

type Step2Draft = {
  nama_lengkap?: string;
  no_ktp?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  status_perkawinan?: string;
  no_hp?: string;
  alamat_domisili?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  bahasa_komunikasi?: string[];
};

type Step3Land = {
  nama_lahan?: string;
  nama_pemilik?: string;
  no_hp?: string;
  alamat_lahan?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kepemilikan?: string;
  luas_lahan_m2?: number;
  status_aktif?: string;
};

type Step3Draft = {
  lands?: Step3Land[];
};

type Step4Draft = {
  payout_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
};

type SupplierAdminDraft = {
  step1?: Step1Draft;
  step2?: Step2Draft;
  step3?: Step3Draft;
  step4?: Step4Draft;
  updatedAt?: string;
};

function maskAccountNumber(value?: string) {
  if (!value) return "-";
  if (value.length <= 4) return value;
  return `**** ${value.slice(-4)}`;
}

function formatOwnership(value?: string) {
  if (!value) return "-";
  switch (value) {
    case "milik_sendiri":
      return "Milik Sendiri";
    case "sewa":
      return "Sewa";
    case "kerjasama":
      return "Kerjasama";
    default:
      return value;
  }
}

function formatPayoutMethod(value?: string) {
  if (!value) return "-";
  return value === "ewallet" ? "E-wallet" : "Bank Transfer";
}

export default function RegisterSupplierAdminStepFiveForm() {
  const router = useRouter();

  const [draft, setDraft] = useState<SupplierAdminDraft | null>(null);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      setDraft(parsed);
    } catch {
      setDraft(null);
    }
  }, []);

  const totalLands = draft?.step3?.lands?.length ?? 0;

  const totalArea = useMemo(() => {
    return (
      draft?.step3?.lands?.reduce((sum, land) => {
        const area = Number(land.luas_lahan_m2 || 0);
        return sum + (Number.isFinite(area) ? area : 0);
      }, 0) ?? 0
    );
  }, [draft]);

  const isDraftComplete = Boolean(
    draft?.step1 &&
      draft?.step2 &&
      draft?.step3?.lands?.length &&
      draft?.step4?.payout_method
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    if (!draft?.step1 || !draft?.step2 || !draft?.step3 || !draft?.step4) {
      toast.error("Draft onboarding belum lengkap.");
      return;
    }

    if (!agreeAccuracy || !agreeTerms) {
      toast.error("Semua deklarasi wajib disetujui.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerSupplier({
        name: draft.step1.name || "",
        username: draft.step1.username || "",
        email: draft.step1.email?.trim() ? draft.step1.email.trim() : null,
        password: draft.step1.password || "",
        password_confirmation: draft.step1.password_confirmation || "",

        nama_lengkap: draft.step2.nama_lengkap || "",
        no_ktp: draft.step2.no_ktp || "",
        tempat_lahir: draft.step2.tempat_lahir || "",
        tanggal_lahir: draft.step2.tanggal_lahir || "",
        jenis_kelamin: draft.step2.jenis_kelamin || "",
        status_perkawinan: draft.step2.status_perkawinan || "",
        no_hp: draft.step2.no_hp || "",
        alamat_domisili: draft.step2.alamat_domisili || "",
        desa: draft.step2.desa || "",
        kecamatan: draft.step2.kecamatan || "",
        kabupaten: draft.step2.kabupaten || "",
        bahasa_komunikasi: draft.step2.bahasa_komunikasi || [],

        lands: draft.step3.lands || [],

        payout: {
          payout_method: draft.step4.payout_method || "",
          bank_name: draft.step4.bank_name || "",
          bank_account_number: draft.step4.bank_account_number || "",
          bank_account_name: draft.step4.bank_account_name || "",
        },
      });

      localStorage.removeItem(DRAFT_KEY);
      toast.success("Supplier berhasil didaftarkan.");
      router.push("/register/supplier/admin/complete");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal submit aplikasi supplier.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isDraftComplete && (
        <div className="mb-6 rounded-xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          Draft onboarding belum lengkap. Pastikan Step 1 sampai Step 4 sudah
          diisi sebelum submit.
        </div>
      )}

      <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 transition-all hover:shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
                <UserCircle2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-on-surface">
                Account Setup
              </h3>
            </div>

            <Link
              href="/register/supplier/admin"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Name
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step1?.name || "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Username
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step1?.username || "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Email Address
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step1?.email || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 transition-all hover:shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-on-surface">
                Personal Details
              </h3>
            </div>

            <Link
              href="/register/supplier/admin/step-2"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Primary Contact
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step2?.nama_lengkap || "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Phone Number
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step2?.no_hp || "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Mailing Address
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step2?.alamat_domisili || "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Communication Languages
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step2?.bahasa_komunikasi?.join(", ") || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 transition-all hover:shadow-sm lg:col-span-2">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
                <Map className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">
                  Land Records &amp; Assets
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {totalLands} parcels registered
                </p>
              </div>
            </div>

            <Link
              href="/register/supplier/admin/step-3"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-surface-container-low p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Cultivable Area
              </p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                {totalArea.toLocaleString("id-ID")} m²
              </p>
            </div>

            <div className="rounded-lg bg-surface-container-low p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Active Parcels
              </p>
              <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                {
                  (draft?.step3?.lands || []).filter(
                    (land) => land.status_aktif === "aktif"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-lg bg-surface-container-low p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Ownership Overview
              </p>
              <p className="mt-2 font-medium text-on-surface">
                {(draft?.step3?.lands || [])
                  .map((land) => formatOwnership(land.kepemilikan))
                  .join(", ") || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {(draft?.step3?.lands || []).map((land, index) => (
              <div
                key={`${land.nama_lahan || "land"}-${index}`}
                className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-on-surface">
                      {land.nama_lahan || `Land Parcel #${index + 1}`}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {land.alamat_lahan || "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-on-surface">
                      {(land.luas_lahan_m2 || 0).toLocaleString("id-ID")} m²
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary">
                      {land.status_aktif || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 transition-all hover:shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-on-surface">
                Payout &amp; Financials
              </h3>
            </div>

            <Link
              href="/register/supplier/admin/step-4"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          </div>

          <div className="flex flex-wrap gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Payout Method
              </span>
              <span className="font-medium text-on-surface">
                {formatPayoutMethod(draft?.step4?.payout_method)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Primary Account
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step4?.bank_name || "-"} (
                {maskAccountNumber(draft?.step4?.bank_account_number)})
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Account Holder
              </span>
              <span className="font-medium text-on-surface">
                {draft?.step4?.bank_account_name || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-20 rounded-xl bg-surface-container-low p-8">
        <h4 className="mb-4 font-headline font-bold text-on-surface">
          Declarations &amp; Agreements
        </h4>

        <div className="mb-8 space-y-4">
          <label className="flex cursor-pointer items-start gap-4">
            <div className="mt-1">
              <input
                type="checkbox"
                checked={agreeAccuracy}
                onChange={(e) => setAgreeAccuracy(e.target.checked)}
                className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
            </div>
            <span className="text-sm leading-relaxed text-on-surface-variant">
              I certify that all information provided is accurate to the best of
              my knowledge and that I have the legal authority to represent the
              listed supplier entity.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4">
            <div className="mt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
            </div>
            <span className="text-sm leading-relaxed text-on-surface-variant">
              I have read and agree to{" "}
              <span className="font-semibold text-primary underline">
                The Precision Harvest Supplier Terms &amp; Conditions
              </span>{" "}
              and{" "}
              <span className="font-semibold text-primary underline">
                Quality Standards Protocol
              </span>
              .
            </span>
          </label>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-outline-variant/20 pt-6 md:flex-row">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <ShieldCheck className="h-5 w-5 text-secondary" />
            <p className="max-w-xs text-xs">
              Your data is encrypted and protected before the final supplier
              payload is submitted.
            </p>
          </div>

          <div className="flex w-full items-center gap-4 md:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-xl border border-outline px-8 py-3 font-bold text-on-surface transition-colors hover:bg-surface-container-high md:flex-none"
            >
              Print Summary
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isDraftComplete}
              className="signature-gradient flex flex-1 items-center justify-center gap-2 rounded-xl px-12 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <FileCheck2 className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h4 className="font-headline text-sm font-bold text-on-surface">
              Final payload assembly
            </h4>
            <p className="mt-2 text-xs leading-7 text-on-surface-variant">
              Step 5 now assembles draft data from Account Setup, Personal
              Details, Land Records, and Payout Info into the final supplier
              registration request.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}