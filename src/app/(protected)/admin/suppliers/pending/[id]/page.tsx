import AdminSupplierDetailView from "@/features/auth/components/admin/admin-supplier-detail-view";

type AdminSupplierDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminSupplierDetailPage({
  params,
}: AdminSupplierDetailPageProps) {
  const { id } = await params;

  return <AdminSupplierDetailView supplierId={decodeURIComponent(id)} />;
}