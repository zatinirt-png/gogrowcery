import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepFiveForm from "@/features/auth/components/register-supplier-admin-step-five-form";

export default function RegisterSupplierGuidedStepFivePage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="review"
      stepLabel="Langkah 5 dari 5"
      title="Tinjau data registrasi"
      description="Periksa kembali data Anda sebelum registrasi supplier dikirim."
    >
      <RegisterSupplierAdminStepFiveForm />
    </RegisterSupplierAdminShell>
  );
}