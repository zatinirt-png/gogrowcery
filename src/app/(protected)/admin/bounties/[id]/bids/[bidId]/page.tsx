import AdminBountyBidDetailView from "@/features/bounty/components/admin/admin-bounty-bid-detail-view";

type AdminBountyBidDetailPageProps = {
  params: Promise<{
    id: string;
    bidId: string;
  }>;
};

export default async function AdminBountyBidDetailPage({
  params,
}: AdminBountyBidDetailPageProps) {
  const { id, bidId } = await params;

  return (
    <AdminBountyBidDetailView
      bountyId={decodeURIComponent(id)}
      bidId={decodeURIComponent(bidId)}
    />
  );
}