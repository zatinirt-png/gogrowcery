import AdminBountyDetailView from "@/features/bounty/components/admin/admin-bounty-detail-view";

type AdminBountyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminBountyDetailPage({
  params,
}: AdminBountyDetailPageProps) {
  const { id } = await params;
  return <AdminBountyDetailView bountyId={decodeURIComponent(id)} />;
}