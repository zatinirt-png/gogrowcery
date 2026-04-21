import Link from "next/link";
import { ArrowRight, Leaf, ShoppingCart } from "lucide-react";

export default function RegisterGatewayCards() {
  return (
    <div className="grid items-stretch gap-8 md:grid-cols-2">
      <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-primary">
          <ShoppingCart className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Daftar sebagai Buyer
        </h2>

        <p className="mt-4 min-h-[3rem] leading-relaxed text-on-surface-variant">
          Cocok untuk user yang ingin membuat akun buyer dan mulai menggunakan platform.
        </p>

        <Link
          href="/register/buyer"
          className="signature-gradient mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition hover:opacity-90"
        >
          Lanjut Daftar Buyer
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-secondary-container/10 blur-3xl transition-colors group-hover:bg-secondary-container/20" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
          <Leaf className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Daftar sebagai Supplier
        </h2>

        <p className="mt-4 min-h-[3rem] leading-relaxed text-on-surface-variant">
          Registrasi supplier difokuskan ke guided registration agar langkah pengisian lebih jelas.
        </p>

        <Link
          href="/register/supplier"
          className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-8 py-4 font-bold text-on-surface transition hover:bg-surface-container-highest"
        >
          Lanjut Daftar Supplier
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}