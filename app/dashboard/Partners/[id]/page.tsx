import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type PartnerDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function PartnerDetailPage({
  params,
}: PartnerDetailPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const partner = await prisma.partners.findUnique({
    where: { id },
    include: {
      partner_contributions: {
        include: {
          campaigns: true,
          products: true,
        },
        orderBy: { created_at: "desc" },
      },
    },
  })

  if (!partner) {
    notFound()
  }

  const totalContributed = partner.partner_contributions.reduce(
    (sum, contribution) => sum + contribution.quantity,
    0
  )

  const field = (label: string, value: string | null | undefined) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">—</span>}
      </p>
    </div>
  )

  return (
    <div className="p-8">
      <Link
        href="/dashboard/Partners"
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Back to Partners
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {partner.company_name}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Partner details and campaign contributions
          </p>
        </div>

        <Link
          href={`/dashboard/Partners/${partner.id}/edit`}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Edit Partner
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Contact
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Contact person", partner.contact_person)}
            {field("Phone", partner.phone)}
            {field("Email", partner.email)}
            {field("Address", partner.address)}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              "Status",
              partner.is_active ? "ACTIVE" : "INACTIVE"
            )}
            {field(
              "Created",
              partner.created_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
            {field(
              "Updated",
              partner.updated_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
            {field("Contributions", String(partner.partner_contributions.length))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Total Contributed
          </h2>

          <p className="text-3xl font-bold text-gray-900">
            {totalContributed.toLocaleString()}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Units across all contributions
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Campaign Contributions
          </h2>
        </div>

        {partner.partner_contributions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            This partner has not made any contributions yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Product
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Campaign
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Type
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Delivery
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {partner.partner_contributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {contribution.products.name}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {contribution.campaigns.name}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {contribution.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {contribution.contribution_type.replaceAll("_", " ")}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        contribution.delivery_status === "DELIVERED"
                          ? "bg-green-100 text-green-700"
                          : contribution.delivery_status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {contribution.delivery_status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {contribution.created_at.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
