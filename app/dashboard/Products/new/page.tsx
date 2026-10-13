import Link from "next/link"
import { createProduct } from "@/app/actions/products"

export default function NewProductPage() {
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
          Add Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new product to the inventory.
        </p>
      </div>

      <form
        action={createProduct}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
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
            placeholder="e.g. Disposable Pads"
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
            placeholder="Describe this product..."
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
            defaultValue="piece"
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
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
          Add Product
        </button>
      </form>
    </div>
  )
}
