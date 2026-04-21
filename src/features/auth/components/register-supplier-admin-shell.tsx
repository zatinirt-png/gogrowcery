import { ReactNode } from "react";
import {
  Badge,
  CircleDollarSign,
  ClipboardCheck,
  HelpCircle,
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
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "account", label: "Account Setup", icon: UserCircle2 },
  { key: "personal", label: "Personal Details", icon: Badge },
  { key: "land", label: "Land Records", icon: Map },
  { key: "payout", label: "Payout Info", icon: CircleDollarSign },
  { key: "review", label: "Review", icon: ClipboardCheck },
];

export default function RegisterSupplierAdminShell({
  activeStep,
  stepLabel,
  title,
  description,
  children,
}: RegisterSupplierAdminShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden h-screen w-72 shrink-0 flex-col gap-2 bg-slate-50 p-4 pt-8 md:flex">
        <div className="mb-8 px-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="signature-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold leading-tight text-on-surface">
                Guided Supplier Registration
              </h2>
              <p className="text-xs text-on-surface-variant">{stepLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.key === activeStep;

            return (
              <div
                key={step.key}
                className={
                  isActive
                    ? "flex items-center gap-3 rounded-l-xl bg-white px-4 py-3 text-green-700 shadow-sm"
                    : "flex items-center gap-3 px-4 py-3 text-slate-500"
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto px-4 pb-4">
          <div className="rounded-xl bg-slate-200/50 px-4 py-3 text-sm font-semibold text-slate-600">
            Draft tersimpan lokal selama onboarding.
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-surface">
        <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-8 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-headline text-xl font-bold tracking-tight text-green-800">
              GoGrowcery
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <HelpCircle className="h-5 w-5 cursor-pointer text-slate-500 transition-colors hover:text-green-600" />
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <UserCircle2 className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-surface-container-low p-8 md:p-12">
          <div className="mx-auto max-w-4xl">
            <section className="mb-12 grid grid-cols-1 items-center gap-8 md:grid-cols-12">
              <div className="md:col-span-7">
                <h1 className="mb-4 font-headline text-5xl font-extrabold tracking-tight text-on-surface">
                  {title}
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-primary bg-white p-6 shadow-sm md:col-span-5">
                <div className="flex items-start gap-4">
                  <ClipboardCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h4 className="mb-1 text-sm font-bold uppercase tracking-wider text-primary">
                      Registration Guidance
                    </h4>
                    <p className="text-sm text-on-surface-variant">
                      Lengkapi tiap bagian dengan benar agar registrasi supplier
                      bisa diproses lebih cepat dan minim revisi.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}