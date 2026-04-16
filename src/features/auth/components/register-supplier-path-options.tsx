import Link from "next/link";
import { ArrowRight, ShieldCheck, UserPlus2, Workflow } from "lucide-react";

export default function RegisterSupplierPathOptions() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-primary">
          <UserPlus2 className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Quick Supplier Register
        </h2>

        <p className="mt-4 min-h-[4rem] leading-relaxed text-on-surface-variant">
          Supplier membuat akun sendiri melalui form registrasi standar untuk
          masuk ke jaringan GoGrowcery.
        </p>

        <div className="mt-auto pt-8">
          <div className="space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Direct supplier account registration</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Suitable for simple self-onboarding</span>
            </div>
          </div>

          <Link
            href="/register/supplier/self"
            className="signature-gradient mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition hover:opacity-90"
          >
            Continue Quick Register
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-secondary-container/10 blur-3xl transition-colors group-hover:bg-secondary-container/20" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
          <Workflow className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Guided Supplier Registration
        </h2>

        <p className="mt-4 min-h-[4rem] leading-relaxed text-on-surface-variant">
          Gunakan flow bertahap untuk melengkapi account setup, personal
          details, land records, payout info, dan final review.
        </p>

        <div className="mt-auto pt-8">
          <div className="space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Multi-step supplier onboarding</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Best for full supplier profile completion</span>
            </div>
          </div>

          <Link
            href="/register/supplier/admin"
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-8 py-4 font-bold text-on-surface transition hover:bg-surface-container-highest"
          >
            Start Guided Registration
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}