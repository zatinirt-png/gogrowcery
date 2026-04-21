"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  HandCoins,
  Plus,
  Search,
} from "lucide-react";
import AdminShell from "@/features/auth/components/admin/admin-shell";

type BountyStatus = "Draft" | "Published" | "Closed" | "Cancelled";

type AdminBountyRow = {
  id: string;
  code: string;
  clientName: string;
  title: string;
  deadlineAt: string;
  status: BountyStatus;
  itemsCount: number;
  createdBy: string;
};

const mockBounties: AdminBountyRow[] = [
  {
    id: "bounty-001",
    code: "BNT-2026-001",
    clientName: "PT Segar Jaya",
    title: "Kebutuhan Sayuran Minggu Ini",
    deadlineAt: "2026-05-01 17:00:00",
    status: "Published",
    itemsCount: 2,
    createdBy: "Super Admin",
  },
  {
    id: "bounty-002",
    code: "BNT-2026-002",
    clientName: "PT Panen Makmur",
    title: "Pengadaan Cabai dan Tomat",
    deadlineAt: "2026-05-04 10:30:00",
    status: "Draft",
    itemsCount: 4,
    createdBy: "Super Admin",
  },
  {
    id: "bounty-003",
    code: "BNT-2026-003",
    clientName: "PT Hasil Tani Nusantara",
    title: "Kebutuhan Bawang Merah Bulanan",
    deadlineAt: "2026-04-28 14:00:00",
    status: "Closed",
    itemsCount: 3,
    createdBy: "Admin Operasional",
  },
  {
    id: "bounty-004",
    code: "BNT-2026-004",
    clientName: "PT Segar Jaya",
    title: "Pengadaan Bayam dan Kangkung",
    deadlineAt: "2026-05-02 08:00:00",
    status: "Published",
    itemsCount: 5,
    createdBy: "Admin Buyer",
  },
  {
    id: "bounty-005",
    code: "BNT-2026-005",
    clientName: "PT Agro Sentosa",
    title: "Sayur Daun untuk Distribusi Restoran",
    deadlineAt: "2026-05-06 16:00:00",
    status: "Cancelled",
    itemsCount: 6,
    createdBy: "Super Admin",
  },
];

function statusClass(status: BountyStatus) {
  if (status === "Published") {
    return "bg-primary/10 text-primary";
  }

  if (status === "Draft") {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (status === "Closed") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-error-container text-on-error-container";
}

function formatDateLabel(value: string) {
  const isoValue = value.replace(" ", "T");
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRemainingLabel(value: string, status: BountyStatus) {
  if (status !== "Published") {
    return status === "Draft" ? "Belum dipublish" : "Tidak aktif";
  }

  const now = new Date();
  const deadline = new Date(value.replace(" ", "T"));

  if (Number.isNaN(deadline.getTime())) {
    return "Deadline tidak valid";
  }

  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Deadline lewat";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return `${diffHours} jam lagi`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} hari lagi`;
}

export default function AdminBountyListView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | BountyStatus>("All");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [clientName, setClientName] = useState("All");

  const clientOptions = useMemo(() => {
    return Array.from(new Set(mockBounties.map((item) => item.clientName))).sort();
  }, []);

  const filteredRows = useMemo(() => {
    return mockBounties.filter((row) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        row.code.toLowerCase().includes(searchValue) ||
        row.clientName.toLowerCase().includes(searchValue) ||
        row.title.toLowerCase().includes(searchValue);

      const matchesStatus = status === "All" ? true : row.status === status;

      const matchesDeadline = deadlineDate
        ? row.deadlineAt.startsWith(deadlineDate)
        : true;

      const matchesClient =
        clientName === "All" ? true : row.clientName === clientName;

      return matchesSearch && matchesStatus && matchesDeadline && matchesClient;
    });
  }, [search, status, deadlineDate, clientName]);

  const stats = useMemo(() => {
    const published = mockBounties.filter((item) => item.status === "Published").length;
    const draft = mockBounties.filter((item) => item.status === "Draft").length;
    const urgent = mockBounties.filter((item) => {
      if (item.status !== "Published") return false;

      const deadline = new Date(item.deadlineAt.replace(" ", "T"));
      if (Number.isNaN(deadline.getTime())) return false;

      const diffMs = deadline.getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      return diffDays > 0 && diffDays <= 3;
    }).length;

    return {
      total: mockBounties.length,
      published,
      draft,
      urgent,
    };
  }, []);

  return (
    <AdminShell
      title="Bounties"
      description="Halaman admin bounty tetap khusus untuk admin. Data list sementara memakai shell lokal sampai endpoint admin list bounty tersedia."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/bounties/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </Link>

          <Link
            href="/admin/bounties/create"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            Open Create Form
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Total Bounties
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.total}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Seluruh bounty pada workspace admin.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <HandCoins className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Published
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.published}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Bounty yang sedang aktif untuk supplier.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Draft
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.draft}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Bounty yang belum dipublish.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3 text-secondary">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Urgent Deadline
                </p>
                <p className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                  {stats.urgent}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Published bounty dengan deadline dekat.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3 text-tertiary">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-6 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_180px_180px_220px_auto] xl:items-end">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Search Bounties
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ID, title, atau client..."
                  className="w-full rounded-2xl border border-transparent bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | BountyStatus)
                }
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Deadline
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Client Name
              </label>
              <select
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
              >
                <option value="All">All Clients</option>
                {clientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("All");
                setDeadlineDate("");
                setClientName("All");
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Bounty Code
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Client Name
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Title
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Deadline
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Items
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Created By
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10">
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-surface-container-lowest transition hover:bg-surface-container-low/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-bold text-primary">
                          {row.code}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-on-surface">
                          {row.clientName}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-on-surface">
                          {row.title}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-on-surface">
                            {formatDateLabel(row.deadlineAt)}
                          </span>
                          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                            {getRemainingLabel(row.deadlineAt, row.status)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.itemsCount} items
                      </td>

                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {row.createdBy}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant"
                          >
                            Detail UI
                          </button>

                          <Link
                            href="/admin/bounties/create"
                            className="rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-95"
                          >
                            Create New
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-on-surface-variant"
                    >
                      Tidak ada bounty yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/10 bg-surface-container-low px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-on-surface-variant">
              Menampilkan{" "}
              <span className="font-bold text-on-surface">{filteredRows.length}</span>{" "}
              dari{" "}
              <span className="font-bold text-on-surface">{mockBounties.length}</span>{" "}
              bounty.
            </p>

            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Admin Shell Only
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-sm font-semibold text-on-surface">Catatan implementasi</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Admin list tidak lagi memakai endpoint supplier. Saat endpoint admin list
            bounty sudah tersedia, baru kita sambungkan ke API admin yang benar.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}