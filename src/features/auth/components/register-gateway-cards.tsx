import Link from "next/link";
import { ArrowRight, Leaf, ShoppingCart, Verified } from "lucide-react";

export default function RegisterGatewayCards() {
  return (
    <div className="grid items-stretch gap-8 md:grid-cols-2">
      <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-primary">
          <ShoppingCart className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Register as Buyer
        </h2>

        <p className="mt-4 min-h-[3rem] leading-relaxed text-on-surface-variant">
          Instant access for restaurants, catering, and retail establishments
          seeking high-quality local produce.
        </p>

        <div className="mt-auto pt-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-on-secondary-container">
                Direct Sourcing
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-on-secondary-container">
                Next-Day Delivery
              </span>
            </div>
          </div>

          <Link
            href="/register/buyer"
            className="signature-gradient mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition hover:opacity-90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] md:p-12">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-secondary-container/10 blur-3xl transition-colors group-hover:bg-secondary-container/20" />

        <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
          <Leaf className="h-8 w-8" />
        </div>

        <h2 className="font-headline text-2xl font-bold text-on-surface">
          Supplier Registration
        </h2>

        <p className="mt-4 min-h-[3rem] leading-relaxed text-on-surface-variant">
          Continue to supplier registration options: self register or admin-created
          onboarding.
        </p>

        <div className="mt-auto pt-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Verified className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-on-secondary-container">
                Verified Status
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Verified className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium uppercase tracking-[0.14em] text-on-secondary-container">
                Global Reach
              </span>
            </div>
          </div>

          <Link
            href="/register/supplier"
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-8 py-4 font-bold text-on-surface transition hover:bg-surface-container-highest"
          >
            Apply to Network
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}