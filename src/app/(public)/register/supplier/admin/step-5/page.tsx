import RegisterSupplierAdminShell from "@/features/auth/components/register-supplier-admin-shell";
import RegisterSupplierAdminStepFiveForm from "@/features/auth/components/register-supplier-admin-step-five-form";

export default function RegisterSupplierAdminStepFivePage() {
  return (
    <RegisterSupplierAdminShell
      activeStep="review"
      stepLabel="Step 5 of 5"
      title="Step 5: Final Review"
      description="Please verify all information before submitting the supplier application. Once submitted, some details should only be changed through review flow."
    >
      <RegisterSupplierAdminStepFiveForm />
    </RegisterSupplierAdminShell>
  );
}