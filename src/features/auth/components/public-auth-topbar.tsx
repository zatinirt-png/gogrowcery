import Link from "next/link";
import AppLogo from "@/components/common/app-logo";

export default function PublicAuthTopbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/10 bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <AppLogo compact />

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-on-surface-variant transition hover:text-primary"
          >
            Beranda
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-on-surface-variant transition hover:text-primary"
          >
            Daftar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            Masuk
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            Daftar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}