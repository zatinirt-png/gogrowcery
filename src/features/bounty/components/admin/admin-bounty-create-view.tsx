import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AdminShell from "@/features/auth/components/admin/admin-shell";
import BountyCreateForm from "./bounty-create-form";

export default function AdminBountyCreateView() {
  return (
    <AdminShell
      title="Create Bounty"
      description="Initialize a new procurement request for GoGrowcery supplier network."
      actions={
        <Link
          href="/admin/bounties"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Bounties
        </Link>
      }
    >
      <BountyCreateForm />
    </AdminShell>
  );
}