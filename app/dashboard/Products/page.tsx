import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { deleteProduct } from "@/app/actions/products"
import PageHeader from "../PageHeader"

export default async function InventoryPage() {
  const products = await prisma.products.findMany({
    include: {
      campaign_products: true,
      partner_contributions: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Inventory"
          description="Track campaign stock and product movement"
        />

        <Link
          href="/dashboard/Products/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New Product
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Products
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Product
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Unit
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Campaigns
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Contributions
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Status
                </th>

                <th className="px-6 py-4 text-right font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>

                    {product.description && (
                      <div className="mt-1 max-w-xs text-xs text-gray-500">
                        {product.description}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.unit}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.campaign_products.length}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.partner_contributions.length}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/Products/${product.id}/edit`}
                        className="text-sm font-medium text-black hover:underline"
                      >
                        Edit
                      </Link>

                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />

                        <button
                          type="submit"
                          className="text-sm font-medium text-red-600 hover:underline"
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
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No products found.
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
