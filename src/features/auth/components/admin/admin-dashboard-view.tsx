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

const quickLinks = [
  {
    title: "Pending queue",
    description: "Buka halaman review supplier yang menunggu persetujuan admin.",
    href: "/admin/suppliers/pending",
    icon: FileSearch,
  },
  {
    title: "Supplier directory",
    description: "Lihat ringkasan suppliers dan akses ke sub tab utama.",
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
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/suppliers/pending"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <FileSearch className="h-4 w-4" />
            Open Pending Review
          </Link>
          <Link
            href="/admin/suppliers"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            <Users className="h-4 w-4" />
            Open Suppliers
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {stat.note}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-container-low p-3">
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Supplier Workflow Summary
                </p>
                <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
                  Admin-side supplier operations
                </h2>
              </div>

              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-bold text-on-surface">
                  Enter queue
                </p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Supplier public registration masuk ke antrian pending review.
                </p>
              </div>

              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-bold text-on-surface">
                  Review data
                </p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Admin membuka halaman pending lalu memeriksa data supplier.
                </p>
              </div>

              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-bold text-on-surface">
                  Approve / Reject
                </p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Tindakan dikirim langsung ke endpoint admin yang tersedia.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-5">
              <p className="text-sm font-semibold text-on-surface">
                Status implementasi
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Struktur dashboard kini lebih dekat ke tampilan Stitch:
                solid surface, tombol tegas, hierarchy lebih jelas, dan area
                supplier menjadi fokus utama.
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Quick Access
            </p>

            <div className="mt-5 grid gap-4">
              {quickLinks.map((row) => {
                const Icon = row.icon;

                return (
                  <Link
                    key={row.href}
                    href={row.href}
                    className="group rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 transition hover:bg-surface-container-high"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 rounded-2xl bg-surface-container-lowest p-3 text-primary shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{row.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                            {row.description}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-on-surface-variant transition group-hover:translate-x-1 group-hover:text-primary" />
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