import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type ProductDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      campaign_products: {
        include: {
          campaigns: true,
          allocation_rules: true,
        },
      },
      partner_contributions: {
        include: {
          partners: true,
          campaigns: true,
        },
        orderBy: { created_at: "desc" },
      },
    },
  })

  if (!product) {
    notFound()
  }

  const totalContributed = product.partner_contributions.reduce(
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
        href="/dashboard/Products"
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Back to Products
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {product.name}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Product details, campaigns and contributions
          </p>
        </div>

        <Link
          href={`/dashboard/Products/${product.id}/edit`}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Edit Product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Unit", product.unit)}
            {field(
              "Status",
              product.is_active ? "ACTIVE" : "INACTIVE"
            )}
            {field("Description", product.description)}
            {field(
              "Created",
              product.created_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Contributed
          </h2>

          <p className="text-3xl font-bold text-gray-900">
            {totalContributed.toLocaleString()}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {product.unit} from {product.partner_contributions.length}{" "}
            {product.partner_contributions.length === 1
              ? "contribution"
              : "contributions"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Campaigns
          </h2>

          {product.campaign_products.length === 0 ? (
            <p className="text-sm text-gray-500">
              Not used in any campaign yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {product.campaign_products.map((link) => (
                <li
                  key={`${link.campaign_id}-${link.product_id}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-900">
                    {link.campaigns.name}
                  </span>

                  {link.allocation_rules && (
                    <span className="text-xs text-gray-500">
                      {link.allocation_rules.quantity_per_participant}{" "}
                      {product.unit}/student
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Partner Contributions
          </h2>
        </div>

        {product.partner_contributions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            No partner contributions recorded for this product yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Partner
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Campaign
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Quantity
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
              {product.partner_contributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {contribution.partners.company_name}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {contribution.campaigns.name}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {contribution.quantity.toLocaleString()}{" "}
                    {product.unit}
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
