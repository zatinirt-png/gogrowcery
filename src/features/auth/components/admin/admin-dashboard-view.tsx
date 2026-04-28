import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileSearch,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import AdminShell from "./admin-shell";

const stats = [
  {
    label: "Pending Approval",
    value: "Live",
    note: "Endpoint pending supplier aktif",
    icon: Clock3,
    tone: "text-primary",
  },
  {
    label: "Approve Action",
    value: "PATCH",
    note: "Action approve dari halaman review",
    icon: BadgeCheck,
    tone: "text-green-600",
  },
  {
    label: "Reject Action",
    value: "PATCH",
    note: "Action reject dari halaman review",
    icon: XCircle,
    tone: "text-red-600",
  },
  {
    label: "Supplier Module",
    value: "Ready",
    note: "Directory, pending, dan add supplier",
    icon: Users,
    tone: "text-secondary",
  },
];

const workflowSteps = [
  {
    label: "Step 1",
    title: "Enter queue",
    description:
      "Supplier public registration masuk ke antrian pending review.",
  },
  {
    label: "Step 2",
    title: "Review data",
    description:
      "Admin membuka halaman pending lalu memeriksa data supplier.",
  },
  {
    label: "Step 3",
    title: "Approve / Reject",
    description:
      "Tindakan dikirim langsung ke endpoint admin yang tersedia.",
  },
];

const quickLinks = [
  {
    title: "Pending queue",
    description:
      "Buka halaman review supplier yang menunggu persetujuan admin.",
    href: "/admin/suppliers/pending",
    icon: FileSearch,
  },
  {
    title: "Supplier directory",
    description:
      "Lihat ringkasan suppliers dan akses ke sub tab utama.",
    href: "/admin/suppliers",
    icon: Users,
  },
  {
    title: "Add supplier",
    description: "Masuk ke halaman input supplier dari sisi admin.",
    href: "/admin/suppliers/add",
    icon: UserPlus,
  },
];

export default function AdminDashboardView() {
  return (
    <AdminShell
      title="Admin Dashboard"
      description="Dashboard admin difokuskan untuk supplier workflow. Pending supplier, approve, dan reject sudah tersambung. Sisanya dibuat dengan tampilan yang siap untuk ekspansi modul berikutnya."
      actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link
            href="/admin/suppliers/pending"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:w-auto"
          >
            <FileSearch className="h-4 w-4 shrink-0" />
            <span className="truncate">Open Pending Review</span>
          </Link>

          <Link
            href="/admin/suppliers"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low sm:w-auto"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">Open Suppliers</span>
          </Link>
        </div>
      }
    >
      <div className="grid gap-5 sm:gap-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                      {stat.label}
                    </p>
                    <p className="mt-3 break-words font-headline text-2xl font-extrabold leading-none text-on-surface sm:text-[2rem]">
                      {stat.value}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                      {stat.note}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl bg-surface-container-low p-3">
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)] xl:gap-6">
          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Supplier Workflow Summary
                </p>
                <h2 className="mt-2 break-words font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                  Admin-side supplier operations
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.label}
                  className="min-w-0 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 sm:p-5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    {step.label}
                  </p>
                  <p className="mt-2 break-words text-base font-bold text-on-surface sm:text-lg">
                    {step.title}
                  </p>
                  <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4 sm:p-5">
              <p className="text-sm font-semibold text-on-surface">
                Status implementasi
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                Struktur dashboard difokuskan agar lebih aman untuk mobile dan
                tablet, dengan hierarchy yang lebih jelas dan komponen yang tidak
                mudah overflow.
              </p>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Quick Access
            </p>

            <div className="mt-5 grid gap-4">
              {quickLinks.map((row) => {
                const Icon = row.icon;

                return (
                  <Link
                    key={row.href}
                    href={row.href}
                    className="group min-w-0 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 transition hover:bg-surface-container-high"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <p className="break-words font-bold text-on-surface">
                            {row.title}
                          </p>
                          <ArrowRight className="mt-0.5 hidden h-4 w-4 shrink-0 text-on-surface-variant transition group-hover:translate-x-1 group-hover:text-primary sm:block" />
                        </div>

                        <p className="mt-1 break-words text-sm leading-6 text-on-surface-variant">
                          {row.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}