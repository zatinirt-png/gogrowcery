import ProtectedUserPanel from "@/features/auth/components/protected-user-panel";

export default function SupplierPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <ProtectedUserPanel
          title="Supplier Workspace"
          description="Halaman sementara untuk verifikasi login supplier, auth token, pemanggilan /me, dan logout."
        />
      </div>
    </main>
  );
}