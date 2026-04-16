import Link from "next/link";
import AppLogo from "./app-logo";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-outline-variant/15 bg-surface-container-lowest">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4 lg:px-8">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <AppLogo />
          <p className="text-sm leading-7 text-on-surface-variant">
            The digital procurement layer for buyers, suppliers, and operational
            teams in modern agriculture.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-on-surface">
            Platform
          </h3>
          <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
            <a href="#features" className="block transition hover:text-primary">
              Features
            </a>
            <a href="#workflow" className="block transition hover:text-primary">
              Workflow
            </a>
            <a href="#supplier" className="block transition hover:text-primary">
              Supplier Network
            </a>
            <a href="#faq" className="block transition hover:text-primary">
              FAQ
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-on-surface">
            Access
          </h3>
          <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
            <Link href="/login" className="block transition hover:text-primary">
              Login
            </Link>
            <Link
              href="/register"
              className="block transition hover:text-primary"
            >
              Register
            </Link>
            <Link
              href="/register/buyer"
              className="block transition hover:text-primary"
            >
              Buyer Registration
            </Link>
            <Link
              href="/register/supplier"
              className="block transition hover:text-primary"
            >
              Supplier Registration
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-on-surface">
            Contact
          </h3>
          <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
            <p>Support Center</p>
            <p>Operations Team</p>
            <p>Procurement Desk</p>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-xs uppercase tracking-[0.18em] text-on-surface-variant md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 GoGrowcery. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Help Center</span>
          </div>
        </div>
      </div>
    </footer>
  );
}