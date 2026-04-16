import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepOneForm from "@/features/auth/components/register-supplier-admin-step-one-form";

export default function RegisterSupplierAdminPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="account"
      stepLabel="Step 1 of 5"
      title="Step 1: Account Setup"
      description="Welcome to The Precision Harvest network. Let’s begin by securing the supplier’s digital workspace through the first onboarding step."
    >
      <RegisterSupplierAdminStepOneForm />

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container p-6">
          <h3 className="font-headline text-sm font-bold">Enterprise Security</h3>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
            Draft data is kept locally first while onboarding steps are still in
            progress.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container p-6">
          <h3 className="font-headline text-sm font-bold">Human Support</h3>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
            Later steps can be filled gradually without forcing final submit on
            step 1.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container p-6">
          <h3 className="font-headline text-sm font-bold">Transparency First</h3>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
            Final supplier account creation can be deferred until review or final
            confirmation step.
          </p>
        </div>
      </div>
    </RegisterSupplierAdminShell>
  );
}