import Link from "next/link"
import { createPartner } from "@/app/actions/partners"

export default function NewPartnerPage() {
  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/Partners"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Partners
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Add Partner
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Register a new campaign partner.
        </p>
      </div>

      <form
        action={createPartner}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="company_name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Company name
          </label>

          <input
            id="company_name"
            name="company_name"
            type="text"
            required
            placeholder="e.g. Acme Trading"
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="contact_person"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Contact person
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <input
            id="contact_person"
            name="contact_person"
            type="text"
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone
              <span className="ml-2 text-xs font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
              <span className="ml-2 text-xs font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Address
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <textarea
            id="address"
            name="address"
            rows={3}
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
            Active partner
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Add Partner
        </button>
      </form>
    </div>
  )
}
