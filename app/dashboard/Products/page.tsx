import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { deleteProduct } from "@/app/actions/products"
import { getInventory } from "@/lib/inventory"
import PageHeader from "../PageHeader"
import CategoryBadge from "../CategoryBadge"
import StatusBadge from "../StatusBadge"

const th =
  "px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"

export default async function InventoryPage() {
  const [{ categories, assignments }, products] =
    await Promise.all([
      getInventory(),
      prisma.products.findMany({
        include: {
          campaign_products: true,
          partner_contributions: true,
        },
        orderBy: { name: "asc" },
      }),
    ])

  const totalInStock = categories.reduce(
    (sum, stock) => sum + stock.unassigned,
    0
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Inventory"
          description="Everything partners donated, counted by category"
        />

        <div className="flex gap-3">
          <Link
            href="/dashboard/contributions/new"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            + Record donation
          </Link>

          <Link
            href="/dashboard/Products/new"
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Stock by category */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((stock) => (
          <div
            key={stock.category}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
          >
            <CategoryBadge category={stock.category} />

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {stock.unassigned.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">in stock, not yet assigned</p>

            <dl className="mt-4 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <dt>Received from partners</dt>
                <dd className="font-semibold text-slate-700">
                  {stock.delivered.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Assigned to campaigns</dt>
                <dd className="font-semibold text-slate-700">
                  {stock.assigned.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Promised, not received</dt>
                <dd className="font-semibold text-slate-700">
                  {stock.expected.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {totalInStock.toLocaleString()} items across all categories are not
        yet assigned to a campaign.
      </p>

      {/* Campaign assignments */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Stock assigned to campaigns
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assigning stock to a campaign is done on the Allocations page.
            </p>
          </div>

          <Link
            href="/dashboard/allocations"
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Allocate stock to a campaign
          </Link>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className={th}>Campaign</th>
              <th className={th}>Category</th>
              <th className={th}>Assigned</th>
              <th className={th}>Given to participants</th>
              <th className={th}>Left</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {assignments.map((row) => (
              <tr
                key={row.campaignProductId}
                className="transition hover:bg-violet-50/40"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {row.campaignName}
                </td>
                <td className="px-6 py-4">
                  <CategoryBadge category={row.category} />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {row.assigned.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-600">{row.allocated}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {Math.max(row.assigned - row.allocated, 0)}
                </td>
              </tr>
            ))}

            {assignments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  No campaign has been given any stock yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Products */}
      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Each category is stocked through one product. Add more only if you
            need to tell brands apart.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={th}>Unit</th>
                <th className={th}>Donations</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="transition hover:bg-violet-50/40"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/Products/${product.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {product.name}
                    </Link>

                    {product.description && (
                      <div className="mt-1 max-w-xs text-xs text-slate-500">
                        {product.description}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <CategoryBadge category={product.category} />
                  </td>

                  <td className="px-6 py-4 text-slate-600">{product.unit}</td>

                  <td className="px-6 py-4 text-slate-600">
                    {product.partner_contributions.length}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={product.is_active ? "ACTIVE" : "INACTIVE"}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/Products/${product.id}/edit`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        Edit
                      </Link>

                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />

                        <button
                          type="submit"
                          className="text-sm font-medium text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No products yet. They are created automatically when you
                    record a donation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
