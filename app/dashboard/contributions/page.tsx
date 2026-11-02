import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ContributionsPage() {
  const contributions = await prisma.partner_contributions.findMany({
    include: {
      partners: true,
      campaigns: true,
      products: true,
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Partner Contributions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track incoming supplies from partners.
          </p>
        </div>
        <Link
          href="/dashboard/contributions/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Record Contribution
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Partner & Product
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Campaign
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Quantity
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contributions.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-5">
                  <div className="font-medium text-gray-900">
                    {c.partners.company_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.products.name}
                  </div>
                </td>
                <td className="px-6 py-5 text-gray-600">{c.campaigns.name}</td>
                <td className="px-6 py-5 font-medium text-gray-900">
                  {c.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      c.delivery_status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : c.delivery_status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.delivery_status}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-600">
                  {c.delivered_at ? c.delivered_at.toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {contributions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No contributions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
