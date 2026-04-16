import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepFourForm from "@/features/auth/components/register-supplier-admin-step-four-form";

export default function RegisterSupplierAdminStepFourPage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="payout"
      stepLabel="Step 4 of 5"
      title="Step 4: Payout Info"
      description="Configure how the supplier will receive settlement. The selected payout method and institution details will be included in the final supplier registration payload."
    >
      <RegisterSupplierAdminStepFourForm />
    </RegisterSupplierAdminShell>
  );
}