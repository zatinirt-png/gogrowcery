import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepThreeForm from "@/features/auth/components/register-supplier-admin-step-three-form";

export default function RegisterSupplierGuidedStepThreePage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="land"
      stepLabel="Langkah 3 dari 5"
      title="Isi data lahan"
      description="Tambahkan informasi lahan yang relevan untuk profil supplier Anda."
    >
      <RegisterSupplierAdminStepThreeForm />
    </RegisterSupplierAdminShell>
  );
}