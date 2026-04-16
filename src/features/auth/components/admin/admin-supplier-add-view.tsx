import Link from "next/link";
import { Save, Send, UserPlus, Waypoints } from "lucide-react";
import AdminShell from "./admin-shell";

export default function AdminSupplierAddView() {
  return (
    <AdminShell
      title="Add Supplier"
      description="Halaman ini dipakai admin untuk memasukkan data supplier secara manual. Fokus saat ini adalah membuat form admin-side yang rapi, solid, dan siap disambungkan ke endpoint final."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Send className="h-4 w-4" />
            Finalize Entry
          </button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            Form Sections
          </p>

          <div className="mt-4 grid gap-2">
            <a
              href="#account-info"
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm"
            >
              Account Info
            </a>
            <a
              href="#personal-info"
              className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
            >
              Personal Details
            </a>
            <a
              href="#land-info"
              className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
            >
              Land Records
            </a>
            <a
              href="#payout-info"
              className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
            >
              Payout Info
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
            <p className="text-sm font-bold text-on-surface">Catatan</p>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Submit ke endpoint final belum disambungkan. Area ini sudah
              dipersiapkan untuk workflow admin registration.
            </p>
          </div>
        </aside>

        <div className="grid gap-6">
          <section
            id="account-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Section 1
                </p>
                <h2 className="font-headline text-2xl font-extrabold text-on-surface">
                  Account Info
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="Budi Tani"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="buditani"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Temporary Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>
          </section>

          <section
            id="personal-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-secondary-container/40 p-3 text-secondary">
                <Waypoints className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Section 2
                </p>
                <h2 className="font-headline text-2xl font-extrabold text-on-surface">
                  Personal Details
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  No KTP
                </label>
                <input
                  type="text"
                  placeholder="3271234567890001"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  No HP
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Alamat Domisili
                </label>
                <textarea
                  rows={3}
                  placeholder="Jl. Merdeka No. 10"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>
          </section>

          <section
            id="land-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Section 3
            </p>
            <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
              Land Records
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Nama Lahan
                </label>
                <input
                  type="text"
                  placeholder="Lahan Utama"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Luas Lahan (m2)
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Alamat Lahan
                </label>
                <textarea
                  rows={3}
                  placeholder="Jl. Kebun No. 5"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>
          </section>

          <section
            id="payout-info"
            className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Section 4
            </p>
            <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">
              Payout Info
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Payout Method
                </label>
                <select className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20">
                  <option>transfer</option>
                  <option>cash</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="BCA"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Bank Account Name
                </label>
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  className="w-full rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 outline-none transition focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/20"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>

              <Link
                href="/admin/suppliers/pending"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                Review Pending Queue
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}