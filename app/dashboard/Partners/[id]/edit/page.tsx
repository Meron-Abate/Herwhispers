import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updatePartner } from "@/app/actions/partners"

type EditPartnerPageProps = {
  params: Promise<{
    id: string
  }>
}


function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default async function EditPartnerPage({
  params,
}: EditPartnerPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const partner = await prisma.partners.findUnique({
    where: { id },
  })

  if (!partner) {
    notFound()
  }

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
          Edit Partner
        </h1>
      </div>

      <form
        action={updatePartner}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={partner.id} />

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
            defaultValue={partner.company_name}
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
            defaultValue={partner.contact_person ?? ""}
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
              defaultValue={partner.phone ?? ""}
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
              defaultValue={partner.email ?? ""}
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
            defaultValue={partner.address ?? ""}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={partner.is_active}
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
          Save Changes
        </button>
      </form>
    </div>
  )
}
