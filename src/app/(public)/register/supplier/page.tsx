import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";

export default function RegisterSupplierPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen items-center justify-center px-6 pb-12 pt-28">
        <div className="w-full max-w-4xl rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Registrasi Supplier
            </h1>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Untuk user supplier, registrasi dilakukan melalui alur bertahap agar setiap data lebih mudah dipahami dan diisi.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-3">
            {[
              "Bahasa formulir sudah penuh Bahasa Indonesia.",
              "Kolom wajib diberi tanda bintang (*).",
              "Alur diarahkan ke guided registration.",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-surface-container-low p-5 text-sm font-medium text-on-surface">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/register/supplier/guided"
              className="signature-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition hover:opacity-90"
            >
              Mulai Registrasi Supplier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}