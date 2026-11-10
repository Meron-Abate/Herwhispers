import { prisma } from "@/lib/prisma";
import PageHeader from "@/app/dashboard/PageHeader";
import ContributionForm from "./ContributionForm";

export default async function NewContributionPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner } = await searchParams;

  const partners = await prisma.partners.findMany({
    where: { is_active: true },
    select: { id: true, company_name: true },
    orderBy: { company_name: "asc" },
  });

  return (
    <div className="max-w-2xl p-8">
      <PageHeader
        title="Record Partner Contribution"
        description="Log what a partner donated, by category and quantity."
      />

      <ContributionForm data={{ partners }} defaultPartnerId={partner} />
    </div>
  );
}
