import Link from "next/link";
import AppLogo from "@/components/common/app-logo";

export default function PublicAuthTopbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/10 bg-background shadow-sm">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-6 py-4">
        <AppLogo compact />

        <div className="hidden items-center gap-6 md:flex">
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

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 md:hidden"
        >
          Masuk
        </Link>
      </div>
    </header>
  );
}