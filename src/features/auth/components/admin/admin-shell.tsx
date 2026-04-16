"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const mainNav = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === "/admin",
  },
  {
    label: "Suppliers",
    href: "/admin/suppliers",
    icon: Users,
    match: (pathname: string) => pathname.startsWith("/admin/suppliers"),
  },
];

const supplierTabs = [
  { label: "Directory", href: "/admin/suppliers" },
  { label: "Pending Review", href: "/admin/suppliers/pending" },
  { label: "Add Supplier", href: "/admin/suppliers/add" },
];

function isSupplierArea(pathname: string) {
  return pathname.startsWith("/admin/suppliers");
}

export default function AdminShell({
  title,
  description,
  children,
  actions,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-outline-variant/20 bg-surface-container-lowest lg:flex lg:flex-col">
          <div className="border-b border-outline-variant/15 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="signature-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-headline text-xl font-extrabold tracking-tight text-primary">
                  GoGrowcery
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Admin Workspace
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const active = item.match(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                      active
                        ? "signature-gradient text-white shadow-sm"
                        : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {isSupplierArea(pathname) ? (
              <div className="mt-8 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Supplier Sub Tabs
                </p>

                <div className="space-y-2">
                  {supplierTabs.map((tab) => {
                    const active = pathname === tab.href;

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={[
                          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                          active
                            ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15"
                            : "bg-transparent text-on-surface-variant hover:bg-surface-container-high",
                        ].join(" ")}
                      >
                        <span>{tab.label}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-outline-variant/15 p-4">
            <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4">
              <p className="text-xs font-bold text-on-surface">Admin Actions</p>
              <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                Fokus utama area admin saat ini adalah supplier review dan
                supplier registration oleh admin.
              </p>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/admin/suppliers/pending"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Review Pending
                </Link>

                <Link
                  href="/admin/suppliers/add"
                  className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-high"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Supplier
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-outline-variant/15 bg-surface-container-lowest shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
            <div className="flex flex-col gap-4 px-5 py-4 md:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative hidden w-full max-w-md md:block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Search admin workspace..."
                      className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end xl:self-auto">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant transition hover:bg-surface-container-low"
                  >
                    <Bell className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant transition hover:bg-surface-container-low"
                  >
                    <Settings className="h-4 w-4" />
                  </button>

                  <Link
                    href="/admin/suppliers/add"
                    className="signature-gradient inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    <Plus className="h-4 w-4" />
                    New Supplier
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                    Admin Panel
                  </p>
                  <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                    {description}
                  </p>
                </div>

                {actions ? <div className="shrink-0">{actions}</div> : null}
              </div>
            </div>
          </header>

          <main className="flex-1 bg-background px-5 py-6 md:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}