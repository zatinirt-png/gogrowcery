import ProtectedUserPanel from "@/features/auth/components/protected-user-panel";

export default function BuyerPage() {
  return (
    <ProtectedUserPanel
      title="Dashboard Buyer"
      description="Kelola akun dan aktivitas buyer dari tampilan yang lebih rapi dan konsisten."
    />
  );
}