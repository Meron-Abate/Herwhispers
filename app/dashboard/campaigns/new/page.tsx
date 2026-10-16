import { prisma } from "@/lib/prisma";
import CampaignForm from "./CampaignForm";

export default async function NewCampaignPage() {
  const assessments = await prisma.assessments.findMany({
    where: { is_active: true },
    select: { id: true, title: true },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new HerWhispers support campaign.
        </p>
      </div>

      <CampaignForm assessments={assessments} />
    </div>
  );
}
