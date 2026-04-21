import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import BountyCreateForm from "./bounty-create-form";

export default function AdminBountyCreateView() {
  return (
    <AdminShell
      title="Create Bounty"
      description="Buat procurement request baru untuk kebutuhan buyer atau operasional internal."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Draft Mode
          </span>

          <Link
            href="/admin/bounties"
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Bounties
          </Link>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Admin Bounty Workflow
                </p>
                <h2 className="mt-1 font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                  Publish from admin first
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Form ini mengikuti desain create bounty yang Anda kirim dan
                  langsung memetakan field ke payload backend.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Required Payload
            </p>

            <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
              <li>
                <span className="font-bold text-on-surface">client_name</span>:
                nama client
              </li>
              <li>
                <span className="font-bold text-on-surface">title</span>: judul
                bounty
              </li>
              <li>
                <span className="font-bold text-on-surface">description</span>:
                catatan tambahan
              </li>
              <li>
                <span className="font-bold text-on-surface">deadline_at</span>:
                format <span className="font-mono text-xs">YYYY-MM-DD HH:mm:ss</span>
              </li>
              <li>
                <span className="font-bold text-on-surface">items[]</span>:
                item_name, target_quantity, unit, notes
              </li>
            </ul>
          </aside>
        </div>

        <BountyCreateForm />
      </div>
    </AdminShell>
  );
}