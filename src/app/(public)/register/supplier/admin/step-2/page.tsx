import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepTwoForm from "@/features/auth/components/register-supplier-admin-step-two-form";

export default function RegisterSupplierAdminStepTwoPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="personal"
      stepLabel="Step 2 of 5"
      title="Step 2: Personal Details"
      description="Complete the supplier profile to ensure operational accuracy, identity clarity, and smoother downstream review."
    >
      <div className="mb-8 hidden items-center gap-2 rounded-full border border-primary-container/20 bg-primary-container/10 px-4 py-2 md:inline-flex">
        <span className="text-xs font-bold text-on-primary-container">
          Secure Data Encryption
        </span>
      </div>

      <RegisterSupplierAdminStepTwoForm />

      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <span className="font-headline text-lg font-bold">?</span>
          </div>
          <div>
            <h4 className="font-headline text-sm font-bold text-on-surface">
              Need assistance?
            </h4>
            <p className="text-xs text-on-surface-variant">
              Our onboarding curators are ready to help you.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-sm font-bold text-primary transition hover:underline"
        >
          Open Live Chat
        </button>
      </div>
    </RegisterSupplierAdminShell>
  );
}