import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepThreeForm from "@/features/auth/components/register-supplier-admin-step-three-form";

export default function RegisterSupplierAdminStepThreePage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="land"
      stepLabel="Step 3 of 5"
      title="Step 3: Land Records"
      description="Define the supplier’s cultivation assets with precision. These land records will become part of the final supplier registration payload."
    >
      <RegisterSupplierAdminStepThreeForm />
    </RegisterSupplierAdminShell>
  );
}