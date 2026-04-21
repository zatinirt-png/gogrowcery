import type { ComponentType, ReactNode } from "react";
import {
  Badge,
  CircleDollarSign,
  ClipboardCheck,
  Map,
  UserCircle2,
} from "lucide-react";

type StepKey = "account" | "personal" | "land" | "payout" | "review";

type RegisterSupplierAdminShellProps = {
  activeStep: StepKey;
  stepLabel: string;
  title: string;
  description: string;
  children: ReactNode;
};

const steps: {
  key: StepKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "account", label: "Akun", icon: UserCircle2 },
  { key: "personal", label: "Data Diri", icon: Badge },
  { key: "land", label: "Data Lahan", icon: Map },
  { key: "payout", label: "Pencairan", icon: CircleDollarSign },
  { key: "review", label: "Tinjau", icon: ClipboardCheck },
];

export default function RegisterSupplierAdminShell({
  activeStep,
  stepLabel,
  title,
  description,
  children,
}: RegisterSupplierAdminShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className="hidden h-screen w-80 shrink-0 border-r border-outline-variant/15 bg-surface-container-lowest md:flex md:flex-col">
        <div className="border-b border-outline-variant/15 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="signature-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-extrabold tracking-tight text-primary">
                Registrasi Supplier
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Guided Flow
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6">
          <div className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            {stepLabel}
          </div>

          <nav className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === activeStep;

              return (
                <div
                  key={step.key}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "signature-gradient text-white shadow-sm"
                      : "text-on-surface-variant",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-surface-container-low text-on-surface",
                    ].join(" ")}
                  >
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-outline-variant/15 p-4">
          <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-low p-4 text-sm leading-7 text-on-surface-variant">
            Draft akan tetap tersimpan di browser selama Anda melanjutkan proses registrasi.
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-background">
        <div className="border-b border-outline-variant/15 bg-surface-container-lowest px-6 py-5 md:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            {stepLabel}
          </p>
          <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
            {description}
          </p>
        </div>

        <div className="flex-1 bg-surface-container-low px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </main>
    </div>
  );
}