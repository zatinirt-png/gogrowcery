import Link from "next/link";
import AppLogo from "./app-logo";

export default function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/20 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <AppLogo compact />

        <nav className="hidden items-center gap-8 text-sm font-semibold text-on-surface-variant md:flex">
          <a href="#features" className="transition hover:text-primary">
            Features
          </a>
          <a href="#workflow" className="transition hover:text-primary">
            Workflow
          </a>
          <a href="#supplier" className="transition hover:text-primary">
            Supplier
          </a>
          <a href="#faq" className="transition hover:text-primary">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low md:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="signature-gradient inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}