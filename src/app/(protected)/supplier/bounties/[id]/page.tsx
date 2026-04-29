import SupplierBountyDetailView from "@/features/bounty/components/supplier/supplier-bounty-detail-view";

type SupplierBountyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupplierBountyDetailPage({
  params,
}: SupplierBountyDetailPageProps) {
  const { id } = await params;
  return <SupplierBountyDetailView bountyId={decodeURIComponent(id)} />;
}