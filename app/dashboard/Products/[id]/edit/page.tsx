import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateProduct } from "@/app/actions/products"

type EditProductPageProps = {
  params: Promise<{
    id: string
  }>
}


function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const product = await prisma.products.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/Products"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Products
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Edit Product
        </h1>
      </div>

      <form
        action={updateProduct}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={product.id} />

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Product name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product.name}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Description
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product.description ?? ""}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="unit"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Unit
          </label>

          <input
            id="unit"
            name="unit"
            type="text"
            defaultValue={product.unit}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={product.is_active}
            className="h-4 w-4"
          />

          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active product
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
