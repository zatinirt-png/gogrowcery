import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepTwoForm from "@/features/auth/components/register-supplier-admin-step-two-form";

export default function RegisterSupplierGuidedStepTwoPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="personal"
      stepLabel="Langkah 2 dari 5"
      title="Lengkapi data diri"
      description="Isi data identitas dan alamat domisili dengan jelas agar proses registrasi lebih mudah ditinjau."
    >
      <RegisterSupplierAdminStepTwoForm />
    </RegisterSupplierAdminShell>
  );
}