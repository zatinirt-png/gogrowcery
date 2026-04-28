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
      <aside className="hidden h-screen w-80 shrink-0 border-r border-outline-variant/15 bg-surface-container-lowest lg:flex lg:flex-col">
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
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-surface-container-low text-on-surface",
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

      <main className="flex min-h-screen flex-1 flex-col bg-background">
        <div className="border-b border-outline-variant/15 bg-surface-container-lowest px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
          <div className="mx-auto max-w-5xl lg:max-w-none">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              {stepLabel}
            </p>
            <h1 className="mt-2 font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
              {description}
            </p>

            <div className="mt-5 lg:hidden">
              <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
                <div className="flex min-w-max gap-2 pb-1">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.key === activeStep;

                    return (
                      <div
                        key={step.key}
                        className={[
                          "flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold whitespace-nowrap",
                          isActive
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-outline-variant/15 bg-surface-container-low text-on-surface-variant",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                            isActive
                              ? "bg-primary text-white"
                              : "bg-surface-container-lowest text-on-surface",
                          ].join(" ")}
                        >
                          {index + 1}
                        </span>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-surface-container-low px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </main>
    </div>
  );
}