import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getEqualAllocationPreview } from "@/lib/allocations"

export const dynamic = "force-dynamic"

export default async function EqualAllocationIndexPage() {
  const campaignProducts =
    await prisma.campaign_products.findMany({
      include: {
        campaigns: true,
        products: true,
      },
      orderBy: {
        campaigns: {
          name: "asc",
        },
      },
    })

  const rows = await Promise.all(
    campaignProducts.map(async (campaignProduct) => ({
      campaignProduct,
      preview: await getEqualAllocationPreview(
        campaignProduct.campaign_id,
        campaignProduct.id
      ),
    }))
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">
        <Link
          href="/dashboard/allocations"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back to Allocations
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            NEW ALLOCATION
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Choose a Campaign Product
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
            Available quantity is the delivered partner contributions minus
            non-cancelled allocations. Only participants without an
            allocation for the campaign product are eligible.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Campaign Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every eligible participant receives the same quantity.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-800">
                No campaign products yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Link a product to a campaign before creating allocations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Campaign",
                      "Product",
                      "Delivered",
                      "Allocated",
                      "Available",
                      "Eligible",
                      "Per participant",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ campaignProduct, preview }) => {
                    const canAllocate =
                      preview.quantityPerParticipant > 0

                    return (
                      <tr
                        key={campaignProduct.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-slate-700">
                            {campaignProduct.campaigns.name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {campaignProduct.products.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {campaignProduct.products.unit}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {preview.contributedQuantity}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {preview.allocatedQuantity}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                            {preview.availableQuantity}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {preview.eligibleParticipantCount}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {preview.quantityPerParticipant > 0
                            ? preview.quantityPerParticipant
                            : "—"}
                        </td>

                        <td className="px-6 py-4">
                          {canAllocate ? (
                            <Link
                              href={`/dashboard/equal-allocations/${campaignProduct.campaign_id}/${campaignProduct.product_id}`}
                              className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                            >
                              Allocate
                            </Link>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Not available
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
