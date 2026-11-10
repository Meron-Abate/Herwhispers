import { prisma } from "@/lib/prisma";
import ContributionForm from "./ContributionForm";

export default async function NewContributionPage() {
  // Fetch data for all three dropdowns concurrently
  const [partners, campaigns, products] = await Promise.all([
    prisma.partners.findMany({
      where: { is_active: true },
      select: { id: true, company_name: true },
      orderBy: { company_name: "asc" },
    }),
    prisma.campaigns.findMany({
      select: { id: true, name: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.products.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Record Partner Contribution
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Log incoming products or manufacturer sponsorships.
        </p>
      </div>

      <ContributionForm data={{ partners, campaigns, products }} />
    </div>
  );
}
