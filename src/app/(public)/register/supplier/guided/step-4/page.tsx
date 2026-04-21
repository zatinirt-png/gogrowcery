import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepFourForm from "@/features/auth/components/register-supplier-admin-step-four-form";

export default function RegisterSupplierGuidedStepFourPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="payout"
      stepLabel="Langkah 4 dari 5"
      title="Pilih metode pencairan"
      description="Isi data pencairan dana sesuai metode yang ingin digunakan."
    >
      <RegisterSupplierAdminStepFourForm />
    </RegisterSupplierAdminShell>
  );
}