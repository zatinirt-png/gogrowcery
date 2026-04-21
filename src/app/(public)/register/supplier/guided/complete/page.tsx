import Link from "next/link";
import { BadgeCheck, Home, RotateCcw } from "lucide-react";

export default function RegisterSupplierGuidedCompletePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-on-surface">
      <div className="absolute inset-0 bg-black/15" />

      <main className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <section className="w-full max-w-2xl rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-2xl md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <BadgeCheck className="h-4 w-4" />
            Registrasi berhasil dikirim
          </div>

          <h1 className="mt-6 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            Data supplier sudah masuk ke sistem.
          </h1>

          <p className="mt-4 text-base leading-8 text-on-surface-variant">
            Terima kasih. Data Anda berhasil dikirim. Silakan lanjutkan ke beranda atau kembali ke halaman registrasi jika dibutuhkan.
          </p>

          <div className="mt-8 rounded-2xl bg-surface-container-low p-5 text-sm leading-7 text-on-surface-variant">
            Pop up sukses ini ditampilkan setelah registrasi agar user mendapat konfirmasi yang lebih jelas.
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/"
              className="signature-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white"
            >
              <Home className="h-4 w-4" />
              Kembali ke beranda
            </Link>

            <Link
              href="/register/supplier"
              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-6 py-3.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest"
            >
              <RotateCcw className="h-4 w-4" />
              Registrasi supplier lagi
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}