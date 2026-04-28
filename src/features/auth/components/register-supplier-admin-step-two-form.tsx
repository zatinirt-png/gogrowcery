"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  supplierAdminStepTwoSchema,
  type SupplierAdminStepTwoValues,
} from "@/features/auth/schema";
import {
  formatSupplierGuidedFileSize,
  getSupplierGuidedKtpDocument,
  saveSupplierGuidedKtpDocument,
  deleteSupplierGuidedKtpDocument,
  SUPPLIER_GUIDED_DRAFT_KEY,
  supplierGuidedRoutes,
} from "@/features/auth/supplier-guided-register";

const DRAFT_KEY = SUPPLIER_GUIDED_DRAFT_KEY;
const MAX_KTP_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_KTP_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type SupplierAdminDraft = {
  step1?: Record<string, unknown>;
  step2?: SupplierAdminStepTwoValues;
  updatedAt?: string;
};

type KtpPreview = {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
};

function Label({
  text,
  required = false,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2.5 block text-sm font-bold text-on-surface">
      {text}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-sm font-medium text-error">{message}</p>;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-low p-4 sm:p-5 md:p-6">
      <div className="mb-6">
        <h2 className="font-headline text-xl font-bold text-on-surface sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

export default function RegisterSupplierAdminStepTwoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [ktpPreview, setKtpPreview] = useState<KtpPreview | null>(null);
  const [isLoadingKtp, setIsLoadingKtp] = useState(true);
  const [isSavingKtp, setIsSavingKtp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SupplierAdminStepTwoValues>({
    resolver: zodResolver(supplierAdminStepTwoSchema),
    defaultValues: {
      nama_lengkap: "",
      no_ktp: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jenis_kelamin: "",
      no_hp: "",
      alamat_domisili: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SupplierAdminDraft;
      if (!parsed.step2) return;

      setValue("nama_lengkap", parsed.step2.nama_lengkap ?? "");
      setValue("no_ktp", parsed.step2.no_ktp ?? "");
      setValue("tempat_lahir", parsed.step2.tempat_lahir ?? "");
      setValue("tanggal_lahir", parsed.step2.tanggal_lahir ?? "");
      setValue("jenis_kelamin", parsed.step2.jenis_kelamin ?? "");
      setValue("no_hp", parsed.step2.no_hp ?? "");
      setValue("alamat_domisili", parsed.step2.alamat_domisili ?? "");
      setValue("desa", parsed.step2.desa ?? "");
      setValue("kecamatan", parsed.step2.kecamatan ?? "");
      setValue("kabupaten", parsed.step2.kabupaten ?? "");
    } catch {
      // ignore malformed draft
    }
  }, [setValue]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function loadStoredKtp() {
      try {
        const storedDocument = await getSupplierGuidedKtpDocument();

        if (!storedDocument || !isMounted) return;

        objectUrl = URL.createObjectURL(storedDocument.file);

        setKtpPreview({
          fileName: storedDocument.fileName,
          fileType: storedDocument.fileType,
          fileSize: storedDocument.fileSize,
          url: objectUrl,
        });
      } catch {
        // IndexedDB may be blocked in some browsers
      } finally {
        if (isMounted) setIsLoadingKtp(false);
      }
    }

    loadStoredKtp();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const saveDraft = (values: SupplierAdminStepTwoValues) => {
    let parsed: SupplierAdminDraft = {};

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) parsed = JSON.parse(raw) as SupplierAdminDraft;
    } catch {
      parsed = {};
    }

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...parsed,
        step2: values,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const handleBack = () => {
    saveDraft(getValues());
    router.push(supplierGuidedRoutes.start);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleKtpFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_KTP_FILE_TYPES.includes(file.type)) {
      toast.error("Format foto KTP harus JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_KTP_FILE_SIZE) {
      toast.error("Ukuran foto KTP maksimal 5 MB.");
      return;
    }

    setIsSavingKtp(true);

    try {
      await saveSupplierGuidedKtpDocument(file);

      setKtpPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);

        return {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          url: URL.createObjectURL(file),
        };
      });

      toast.success("Foto KTP tersimpan.");
    } catch {
      toast.error("Gagal menyimpan foto KTP. Coba upload ulang.");
    } finally {
      setIsSavingKtp(false);
    }
  };

  const handleRemoveKtp = async () => {
    setIsSavingKtp(true);

    try {
      await deleteSupplierGuidedKtpDocument();

      setKtpPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return null;
      });

      toast.success("Foto KTP dihapus.");
    } catch {
      toast.error("Gagal menghapus foto KTP.");
    } finally {
      setIsSavingKtp(false);
    }
  };

  const onSubmit = async (values: SupplierAdminStepTwoValues) => {
    const storedKtp = await getSupplierGuidedKtpDocument().catch(() => null);

    if (!storedKtp) {
      toast.error("Foto KTP wajib diupload sebelum lanjut.");
      return;
    }

    saveDraft(values);
    toast.success("Data diri dan foto KTP tersimpan.");
    router.push(supplierGuidedRoutes.step3);
  };

  return (
    <div className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-[2rem] sm:p-6 md:p-8">
      <div className="mb-8 rounded-2xl bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant sm:px-5">
        Kolom dengan tanda <span className="font-bold text-error">*</span> wajib
        diisi. Upload foto KTP diperlukan untuk validasi identitas supplier.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 sm:space-y-10">
        <SectionCard
          title="Identitas utama"
          description="Isi data sesuai KTP agar proses verifikasi lebih cepat."
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:gap-y-6">
            <div>
              <Label text="Nama lengkap sesuai identitas" required />
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                {...register("nama_lengkap")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.nama_lengkap?.message} />
            </div>

            <div>
              <Label text="Nomor KTP / NIK" required />
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                placeholder="16 digit nomor identitas"
                {...register("no_ktp")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.no_ktp?.message} />
            </div>

            <div>
              <Label text="Tempat lahir" required />
              <input
                type="text"
                placeholder="Contoh: Bandung"
                {...register("tempat_lahir")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.tempat_lahir?.message} />
            </div>

            <div>
              <Label text="Tanggal lahir" required />
              <input
                type="date"
                {...register("tanggal_lahir")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.tanggal_lahir?.message} />
            </div>

            <div>
              <Label text="Jenis kelamin" required />
              <select
                {...register("jenis_kelamin")}
                className="w-full appearance-none rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
              <FieldError message={errors.jenis_kelamin?.message} />
            </div>


            <div className="md:col-span-2">
              <Label text="Nomor HP aktif" required />
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                {...register("no_hp")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.no_hp?.message} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Foto KTP"
          description="Upload foto KTP yang jelas, tidak blur, dan seluruh sisi kartu terlihat."
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleKtpFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <button
              type="button"
              onClick={handleChooseFile}
              disabled={isSavingKtp}
              className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-outline-variant/25 bg-white px-6 py-8 text-center transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingKtp || isLoadingKtp ? (
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              ) : ktpPreview ? (
                <CheckCircle2 className="mb-4 h-8 w-8 text-primary" />
              ) : (
                <Upload className="mb-4 h-8 w-8 text-primary" />
              )}

              <p className="font-headline text-lg font-bold text-on-surface">
                {ktpPreview ? "Foto KTP sudah terupload" : "Upload foto KTP"}
              </p>

              <p className="mt-3 max-w-md text-sm leading-7 text-on-surface-variant">
                Klik area ini untuk memilih file. Format yang diterima JPG, PNG,
                atau WEBP. Maksimal 5 MB.
              </p>
            </button>

            <div className="rounded-[1.5rem] border border-outline-variant/15 bg-white p-4 sm:p-5">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-high">
                {ktpPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ktpPreview.url}
                    alt="Preview foto KTP"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-5 text-center text-sm leading-6 text-on-surface-variant">
                    Preview foto KTP akan tampil di sini.
                  </div>
                )}
              </div>

              <div className="mt-4 min-w-0">
                <p className="truncate text-sm font-bold text-on-surface">
                  {ktpPreview?.fileName || "Belum ada file"}
                </p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  {ktpPreview
                    ? `${formatSupplierGuidedFileSize(ktpPreview.fileSize)} • ${
                        ktpPreview.fileType || "image"
                      }`
                    : "Wajib diisi"}
                </p>
              </div>

              {ktpPreview ? (
                <button
                  type="button"
                  onClick={handleRemoveKtp}
                  disabled={isSavingKtp}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-error/20 bg-error-container px-4 py-3.5 text-sm font-bold text-on-error-container transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingKtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Hapus foto KTP
                </button>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Alamat domisili"
          description="Masukkan alamat tempat tinggal aktif supplier."
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:gap-y-6">
            <div className="md:col-span-2">
              <Label text="Alamat domisili lengkap" required />
              <textarea
                rows={4}
                placeholder="Tuliskan alamat domisili dengan jelas"
                {...register("alamat_domisili")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.alamat_domisili?.message} />
            </div>

            <div>
              <Label text="Desa / Kelurahan" required />
              <input
                type="text"
                placeholder="Contoh: Sukamaju"
                {...register("desa")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.desa?.message} />
            </div>

            <div>
              <Label text="Kecamatan" required />
              <input
                type="text"
                placeholder="Contoh: Antapani"
                {...register("kecamatan")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.kecamatan?.message} />
            </div>

            <div className="md:col-span-2">
              <Label text="Kabupaten / Kota" required />
              <input
                type="text"
                placeholder="Contoh: Kota Bandung"
                {...register("kabupaten")}
                className="w-full rounded-2xl border border-outline-variant/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
              />
              <FieldError message={errors.kabupaten?.message} />
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4 border-t border-outline-variant/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-6 py-3.5 font-bold text-on-surface transition hover:bg-surface-container-high sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isSavingKtp || isLoadingKtp}
            className="signature-gradient inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Lanjut ke data lahan
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}