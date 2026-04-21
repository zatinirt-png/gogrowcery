"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Loader2,
  Map,
  PencilLine,
  Send,
  Smartphone,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { registerSupplier } from "@/features/auth/api";
import {
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;

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
  ewallet_name?: string;
  ewallet_account_number?: string;
  ewallet_account_name?: string;
};

type SupplierAdminDraft = {
  step1?: Step1Draft;
  step2?: Step2Draft;
  step3?: Step3Draft;
  step4?: Step4Draft;
  updatedAt?: string;
};

function maskValue(value?: string) {
  if (!value) return "-";
  if (value.length <= 4) return value;
  return `•••• ${value.slice(-4)}`;
}

function formatPayoutMethod(value?: string) {
  if (!value) return "-";
  return value === "ewallet" ? "E-wallet" : "Transfer bank";
}

function ReviewItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-7 text-on-surface">{value || "-"}</p>
    </div>
  );
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

  const handleSubmit = async () => {
    if (!draft?.step1 || !draft?.step2 || !draft?.step3 || !draft?.step4) {
      toast.error("Draft registrasi belum lengkap.");
      return;
    }

    if (!agreeAccuracy || !agreeTerms) {
      toast.error("Silakan centang seluruh persetujuan sebelum mengirim data.");
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

        nama_lengkap: draft.step2.nama_lengkap || undefined,
        no_ktp: draft.step2.no_ktp || undefined,
        tempat_lahir: draft.step2.tempat_lahir || undefined,
        tanggal_lahir: draft.step2.tanggal_lahir || undefined,
        jenis_kelamin: draft.step2.jenis_kelamin || undefined,
        status_perkawinan: draft.step2.status_perkawinan || undefined,
        no_hp: draft.step2.no_hp || undefined,
        alamat_domisili: draft.step2.alamat_domisili || undefined,
        desa: draft.step2.desa || undefined,
        kecamatan: draft.step2.kecamatan || undefined,
        kabupaten: draft.step2.kabupaten || undefined,
        bahasa_komunikasi:
          draft.step2.bahasa_komunikasi && draft.step2.bahasa_komunikasi.length > 0
            ? draft.step2.bahasa_komunikasi
            : undefined,

        lands: draft.step3.lands || [],

        payout:
          draft.step4.payout_method === "ewallet"
            ? {
                payout_method: "ewallet",
                ewallet_name: draft.step4.ewallet_name || "",
                ewallet_account_number:
                  draft.step4.ewallet_account_number || "",
                ewallet_account_name: draft.step4.ewallet_account_name || "",
              }
            : {
                payout_method: "transfer",
                bank_name: draft.step4.bank_name || "",
                bank_account_number: draft.step4.bank_account_number || "",
                bank_account_name: draft.step4.bank_account_name || "",
              },
      });

      localStorage.removeItem(DRAFT_KEY);
      toast.success("Registrasi supplier berhasil dikirim.");
      router.push(supplierGuidedRoutes.complete);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim registrasi supplier.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isDraftComplete && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Data registrasi belum lengkap. Pastikan langkah 1 sampai langkah 4 sudah terisi.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-xl font-bold text-on-surface">Data akun</h3>
            </div>
            <Link href={supplierGuidedRoutes.start} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <PencilLine className="h-4 w-4" />
              Ubah
            </Link>
          </div>
          <div className="space-y-4">
            <ReviewItem label="Nama akun" value={draft?.step1?.name} />
            <ReviewItem label="Username" value={draft?.step1?.username} />
            <ReviewItem label="Email" value={draft?.step1?.email || "Tidak diisi"} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-xl font-bold text-on-surface">Data diri</h3>
            </div>
            <Link href={supplierGuidedRoutes.step2} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <PencilLine className="h-4 w-4" />
              Ubah
            </Link>
          </div>
          <div className="space-y-4">
            <ReviewItem label="Nama lengkap" value={draft?.step2?.nama_lengkap} />
            <ReviewItem label="NIK" value={draft?.step2?.no_ktp} />
            <ReviewItem label="Tempat lahir" value={draft?.step2?.tempat_lahir} />
            <ReviewItem label="Tanggal lahir" value={draft?.step2?.tanggal_lahir} />
            <ReviewItem label="Jenis kelamin" value={draft?.step2?.jenis_kelamin === "laki_laki" ? "Laki-laki" : draft?.step2?.jenis_kelamin === "perempuan" ? "Perempuan" : "-"} />
            <ReviewItem label="Nomor HP" value={draft?.step2?.no_hp} />
            <ReviewItem label="Alamat domisili" value={draft?.step2?.alamat_domisili} />
            <ReviewItem label="Desa / Kelurahan" value={draft?.step2?.desa} />
            <ReviewItem label="Kecamatan" value={draft?.step2?.kecamatan} />
            <ReviewItem label="Kabupaten / Kota" value={draft?.step2?.kabupaten} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Map className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-xl font-bold text-on-surface">Data lahan</h3>
            </div>
            <Link href={supplierGuidedRoutes.step3} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <PencilLine className="h-4 w-4" />
              Ubah
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total lahan</p>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">{totalLands}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total luas</p>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">{totalArea} m²</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Status</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">Siap ditinjau</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {draft?.step3?.lands?.map((land, index) => (
              <article key={`${land.nama_lahan || "land"}-${index}`} className="rounded-2xl bg-surface-container-low p-5">
                <p className="text-sm font-bold text-on-surface">Lahan {index + 1}</p>
                <div className="mt-4 space-y-3">
                  <ReviewItem label="Pemilik / pengelola" value={land.nama_pemilik} />
                  <ReviewItem label="Nomor HP" value={land.no_hp} />
                  <ReviewItem label="Alamat lahan" value={land.alamat_lahan} />
                  <ReviewItem label="Desa / Kelurahan" value={land.desa} />
                  <ReviewItem label="Kecamatan" value={land.kecamatan} />
                  <ReviewItem label="Kabupaten / Kota" value={land.kabupaten} />
                  <ReviewItem label="Provinsi" value={land.provinsi} />
                  <ReviewItem label="Kepemilikan" value={land.kepemilikan} />
                  <ReviewItem label="Luas lahan" value={land.luas_lahan_m2 ? `${land.luas_lahan_m2} m²` : "-"} />
                  <ReviewItem label="Status" value={land.status_aktif} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {draft?.step4?.payout_method === "ewallet" ? (
                <Smartphone className="h-5 w-5 text-primary" />
              ) : (
                <Banknote className="h-5 w-5 text-primary" />
              )}
              <h3 className="font-headline text-xl font-bold text-on-surface">Data pencairan</h3>
            </div>
            <Link href={supplierGuidedRoutes.step4} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <PencilLine className="h-4 w-4" />
              Ubah
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewItem label="Metode pencairan" value={formatPayoutMethod(draft?.step4?.payout_method)} />
            {draft?.step4?.payout_method === "ewallet" ? (
              <>
                <ReviewItem label="Nama e-wallet" value={draft?.step4?.ewallet_name} />
                <ReviewItem label="Nama pemilik akun" value={draft?.step4?.ewallet_account_name} />
                <ReviewItem label="Nomor e-wallet" value={maskValue(draft?.step4?.ewallet_account_number)} />
              </>
            ) : (
              <>
                <ReviewItem label="Nama bank" value={draft?.step4?.bank_name} />
                <ReviewItem label="Nama pemilik rekening" value={draft?.step4?.bank_account_name} />
                <ReviewItem label="Nomor rekening" value={maskValue(draft?.step4?.bank_account_number)} />
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
            <input
              type="checkbox"
              checked={agreeAccuracy}
              onChange={(event) => setAgreeAccuracy(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>Saya menyatakan data yang diisi sudah benar dan sesuai kondisi saat ini.</span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>Saya setuju untuk melanjutkan proses registrasi supplier.</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={supplierGuidedRoutes.step4}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-6 py-3.5 font-bold text-on-surface transition hover:bg-surface-container-high"
          >
            <PencilLine className="h-4 w-4" />
            Kembali ke langkah sebelumnya
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isDraftComplete}
            className="signature-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim registrasi
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}