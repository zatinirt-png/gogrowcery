import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepOneForm from "@/features/auth/components/register-supplier-admin-step-one-form";

export default function RegisterSupplierGuidedPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="account"
      stepLabel="Langkah 1 dari 5"
      title="Buat akun supplier"
      description="Mulai dengan data akun dasar untuk login dan melanjutkan proses registrasi supplier."
    >
      <RegisterSupplierAdminStepOneForm />
    </RegisterSupplierAdminShell>
  );
}