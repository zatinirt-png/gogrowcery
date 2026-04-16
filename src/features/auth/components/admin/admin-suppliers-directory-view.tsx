import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileText,
  UserPlus,
  Users,
} from "lucide-react";
import AdminShell from "./admin-shell";

const directoryRows = [
  {
    name: "Green Horizon Co.",
    username: "@green_horizon",
    source: "Public",
    status: "Pending",
    survey: "Waiting",
    location: "Bandung",
  },
  {
    name: "Terra Harvest Farm",
    username: "@terra_harvest",
    source: "Admin",
    status: "Approved",
    survey: "Reviewed",
    location: "Lembang",
  },
  {
    name: "Agri Valley Supply",
    username: "@agri_valley",
    source: "Public",
    status: "Pending",
    survey: "Waiting",
    location: "Garut",
  },
];

function pillClass(value: string) {
  if (value.toLowerCase() === "approved") {
    return "bg-primary text-white";
  }

  if (value.toLowerCase() === "pending") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-surface-container-high text-on-surface-variant";
}

export default function AdminSuppliersDirectoryView() {
  return (
    <AdminShell
      title="Suppliers"
      description="Halaman ini adalah sub tab utama suppliers. Directory masih berupa shell, sedangkan pending review tetap menjadi bagian live untuk workflow admin."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/suppliers/pending"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Clock3 className="h-4 w-4" />
            Pending Review
          </Link>
          <Link
            href="/admin/suppliers/add"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            <UserPlus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Directory
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  Shell
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Tampilan utama supplier admin.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Pending
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  Live
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Review queue sudah tersambung API.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Approve
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  Ready
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Dilakukan dari halaman pending review.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-green-600">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Form
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold">
                  Add
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  UI add supplier admin sudah siap.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 text-secondary">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Supplier Directory
              </p>
              <h2 className="mt-2 font-headline text-2xl font-extrabold">
                Overview table
              </h2>
            </div>

            <Link
              href="/admin/suppliers/pending"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              Open Pending
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-outline-variant/15">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Supplier
                    </th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Username
                    </th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Location
                    </th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Status
                    </th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Survey
                    </th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Source
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/10">
                  {directoryRows.map((row) => (
                    <tr key={row.name} className="bg-white">
                      <td className="px-5 py-4">
                        <p className="font-bold text-on-surface">{row.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.username}
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.location}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${pillClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.survey}
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Area ini sengaja dibuat sebagai directory shell. Data live utama tetap
            ada pada tab <span className="font-bold text-on-surface">Pending Review</span>.
          </div>
        </section>
      </div>
    </AdminShell>
  );
}