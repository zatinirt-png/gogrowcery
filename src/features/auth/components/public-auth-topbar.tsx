import Link from "next/link";
import AppLogo from "@/components/common/app-logo";

export default function PublicAuthTopbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4">
        <AppLogo compact />

        <div className="flex items-center gap-6">
          <button
            type="button"
            className="text-sm font-semibold text-primary transition hover:opacity-80"
          >
            Support
          </button>

          <Link
            href="/login"
            className="text-sm font-medium text-on-surface-variant transition hover:text-primary"
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="h-px bg-outline-variant/10" />
    </header>
  );
}