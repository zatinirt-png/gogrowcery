"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  FileImage,
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
  deleteSupplierGuidedKtpDocument,
  formatSupplierGuidedFileSize,
  getSupplierGuidedKtpDocument,
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
  type SupplierGuidedStoredDocument,
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
  no_hp?: string;
  alamat_domisili?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
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

type KtpReviewPreview = {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
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

function formatGender(value?: string) {
  if (value === "laki_laki") return "Laki-laki";
  if (value === "perempuan") return "Perempuan";
  return "-";
}

function createKtpFileFromStoredDocument(storedDocument: SupplierGuidedStoredDocument) {
  return new File([storedDocument.file], storedDocument.fileName || "ktp_document", {
    type:
      storedDocument.fileType ||
      storedDocument.file.type ||
      "application/octet-stream",
  });
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-7 text-on-surface">
        {value || "-"}
      </p>
    </div>
  );
}

function ReviewCard({
  icon,
  title,
  editHref,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  editHref: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-[2rem] sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-headline text-xl font-bold text-on-surface">
            {title}
          </h3>
        </div>

        <Link
          href={editHref}
          className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
        >
          <PencilLine className="h-4 w-4" />
          Ubah
        </Link>
      </div>

      {children}
    </section>
  );
}

export default function RegisterSupplierAdminStepFiveForm() {
  const router = useRouter();

  const [draft, setDraft] = useState<SupplierAdminDraft | null>(null);
  const [ktpDocument, setKtpDocument] =
    useState<SupplierGuidedStoredDocument | null>(null);
  const [ktpPreview, setKtpPreview] = useState<KtpReviewPreview | null>(null);
  const [isLoadingKtp, setIsLoadingKtp] = useState(true);
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

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function loadKtpDocument() {
      try {
        const storedDocument = await getSupplierGuidedKtpDocument();

        if (!storedDocument || !isMounted) return;

        objectUrl = URL.createObjectURL(storedDocument.file);

        setKtpDocument(storedDocument);
        setKtpPreview({
          fileName: storedDocument.fileName,
          fileType: storedDocument.fileType,
          fileSize: storedDocument.fileSize,
          url: objectUrl,
        });
      } catch {
        setKtpDocument(null);
        setKtpPreview(null);
      } finally {
        if (isMounted) setIsLoadingKtp(false);
      }
    }

    loadKtpDocument();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
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
      draft?.step4?.payout_method &&
      ktpDocument
  );

  const handleSubmit = async () => {
    if (!draft?.step1 || !draft?.step2 || !draft?.step3 || !draft?.step4) {
      toast.error("Draft registrasi belum lengkap.");
      return;
    }

    const storedKtpDocument =
      ktpDocument || (await getSupplierGuidedKtpDocument().catch(() => null));

    if (!storedKtpDocument) {
      toast.error("Foto KTP belum tersedia. Upload ulang foto KTP di langkah 2.");
      router.push(supplierGuidedRoutes.step2);
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

        ktp_document: createKtpFileFromStoredDocument(storedKtpDocument),

        nama_lengkap: draft.step2.nama_lengkap || undefined,
        no_ktp: draft.step2.no_ktp || undefined,
        tempat_lahir: draft.step2.tempat_lahir || undefined,
        tanggal_lahir: draft.step2.tanggal_lahir || undefined,
        jenis_kelamin: draft.step2.jenis_kelamin || undefined,
        no_hp: draft.step2.no_hp || undefined,
        alamat_domisili: draft.step2.alamat_domisili || undefined,
        desa: draft.step2.desa || undefined,
        kecamatan: draft.step2.kecamatan || undefined,
        kabupaten: draft.step2.kabupaten || undefined,
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
      await deleteSupplierGuidedKtpDocument().catch(() => undefined);

      toast.success("Registrasi supplier berhasil dikirim.");
      router.push(supplierGuidedRoutes.complete);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengirim registrasi supplier.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isDraftComplete && !isLoadingKtp ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-error/15 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Data registrasi belum lengkap. Pastikan langkah 1 sampai langkah 4
            sudah terisi dan foto KTP sudah diupload.
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReviewCard
          icon={<UserCircle2 className="h-5 w-5 text-primary" />}
          title="Data akun"
          editHref={supplierGuidedRoutes.start}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewItem label="Nama akun" value={draft?.step1?.name} />
            <ReviewItem label="Username" value={draft?.step1?.username} />
            <ReviewItem
              label="Email"
              value={draft?.step1?.email || "Tidak diisi"}
            />
          </div>
        </ReviewCard>

        <ReviewCard
          icon={<BadgeCheck className="h-5 w-5 text-primary" />}
          title="Data diri"
          editHref={supplierGuidedRoutes.step2}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewItem
              label="Nama lengkap"
              value={draft?.step2?.nama_lengkap}
            />
            <ReviewItem label="NIK" value={draft?.step2?.no_ktp} />
            <ReviewItem
              label="Tempat lahir"
              value={draft?.step2?.tempat_lahir}
            />
            <ReviewItem
              label="Tanggal lahir"
              value={draft?.step2?.tanggal_lahir}
            />
            <ReviewItem
              label="Jenis kelamin"
              value={formatGender(draft?.step2?.jenis_kelamin)}
            />
            <ReviewItem label="Nomor HP" value={draft?.step2?.no_hp} />
            <ReviewItem
              label="Alamat domisili"
              value={draft?.step2?.alamat_domisili}
            />
            <ReviewItem label="Desa / Kelurahan" value={draft?.step2?.desa} />
            <ReviewItem label="Kecamatan" value={draft?.step2?.kecamatan} />
            <ReviewItem
              label="Kabupaten / Kota"
              value={draft?.step2?.kabupaten}
            />
          </div>
        </ReviewCard>

        <ReviewCard
          icon={<FileImage className="h-5 w-5 text-primary" />}
          title="Dokumen KTP"
          editHref={supplierGuidedRoutes.step2}
          className="lg:col-span-2"
        >
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low">
              <div className="aspect-[4/3]">
                {isLoadingKtp ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : ktpPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ktpPreview.url}
                    alt="Preview foto KTP"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-5 text-center text-sm leading-6 text-on-surface-variant">
                    Foto KTP belum tersedia.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                {ktpPreview ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-error" />
                )}
                <p className="font-bold text-on-surface">
                  {ktpPreview ? "Foto KTP siap dikirim" : "Foto KTP belum ada"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewItem
                  label="Nama file"
                  value={ktpPreview?.fileName || "-"}
                />
                <ReviewItem
                  label="Ukuran file"
                  value={
                    ktpPreview
                      ? formatSupplierGuidedFileSize(ktpPreview.fileSize)
                      : "-"
                  }
                />
                <ReviewItem
                  label="Format"
                  value={ktpPreview?.fileType || "-"}
                />
              </div>

              {!ktpPreview ? (
                <Link
                  href={supplierGuidedRoutes.step2}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
                >
                  Upload foto KTP
                </Link>
              ) : null}
            </div>
          </div>
        </ReviewCard>

        <ReviewCard
          icon={<Map className="h-5 w-5 text-primary" />}
          title="Data lahan"
          editHref={supplierGuidedRoutes.step3}
          className="lg:col-span-2"
        >
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Total lahan
              </p>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">
                {totalLands}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Total luas
              </p>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">
                {totalArea} m²
              </p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Status
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                Siap ditinjau
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {draft?.step3?.lands?.map((land, index) => (
              <article
                key={`${land.nama_lahan || "land"}-${index}`}
                className="rounded-2xl bg-surface-container-low p-4 sm:p-5"
              >
                <p className="text-sm font-bold text-on-surface">
                  Lahan {index + 1}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ReviewItem
                    label="Nama lahan"
                    value={land.nama_lahan}
                  />
                  <ReviewItem
                    label="Pemilik / pengelola"
                    value={land.nama_pemilik}
                  />
                  <ReviewItem label="Nomor HP" value={land.no_hp} />
                  <ReviewItem
                    label="Alamat lahan"
                    value={land.alamat_lahan}
                  />
                  <ReviewItem label="Desa / Kelurahan" value={land.desa} />
                  <ReviewItem label="Kecamatan" value={land.kecamatan} />
                  <ReviewItem
                    label="Kabupaten / Kota"
                    value={land.kabupaten}
                  />
                  <ReviewItem label="Provinsi" value={land.provinsi} />
                  <ReviewItem
                    label="Kepemilikan"
                    value={land.kepemilikan}
                  />
                  <ReviewItem
                    label="Luas lahan"
                    value={
                      land.luas_lahan_m2 ? `${land.luas_lahan_m2} m²` : "-"
                    }
                  />
                  <ReviewItem label="Status" value={land.status_aktif} />
                </div>
              </article>
            ))}
          </div>
        </ReviewCard>

        <ReviewCard
          icon={
            draft?.step4?.payout_method === "ewallet" ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Banknote className="h-5 w-5 text-primary" />
            )
          }
          title="Data pencairan"
          editHref={supplierGuidedRoutes.step4}
          className="lg:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ReviewItem
              label="Metode pencairan"
              value={formatPayoutMethod(draft?.step4?.payout_method)}
            />

            {draft?.step4?.payout_method === "ewallet" ? (
              <>
                <ReviewItem
                  label="Nama e-wallet"
                  value={draft?.step4?.ewallet_name}
                />
                <ReviewItem
                  label="Nama pemilik akun"
                  value={draft?.step4?.ewallet_account_name}
                />
                <ReviewItem
                  label="Nomor e-wallet"
                  value={maskValue(draft?.step4?.ewallet_account_number)}
                />
              </>
            ) : (
              <>
                <ReviewItem
                  label="Nama bank"
                  value={draft?.step4?.bank_name}
                />
                <ReviewItem
                  label="Nama pemilik rekening"
                  value={draft?.step4?.bank_account_name}
                />
                <ReviewItem
                  label="Nomor rekening"
                  value={maskValue(draft?.step4?.bank_account_number)}
                />
              </>
            )}
          </div>
        </ReviewCard>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
            <input
              type="checkbox"
              checked={agreeAccuracy}
              onChange={(event) => setAgreeAccuracy(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              Saya menyatakan data yang diisi sudah benar dan sesuai kondisi
              saat ini.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>Saya setuju untuk melanjutkan proses registrasi supplier.</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={supplierGuidedRoutes.step4}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-6 py-3.5 font-bold text-on-surface transition hover:bg-surface-container-high sm:w-auto"
          >
            <PencilLine className="h-4 w-4" />
            Kembali ke langkah sebelumnya
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingKtp || !isDraftComplete}
            className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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