import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { deletePartner } from "@/app/actions/partners"
import PageHeader from "../PageHeader"

export default async function PartnersPage() {
  const partners = await prisma.partners.findMany({
    include: {
      partner_contributions: true,
    },
    orderBy: {
      company_name: "asc",
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Partners"
          description="Manage campaign partners and contributions"
        />

        <Link
          href="/dashboard/Partners/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New Partner
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Company
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Contact
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
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      <Link
                        href={`/dashboard/Partners/${partner.id}`}
                        className="hover:underline"
                      >
                        {partner.company_name}
                      </Link>
                    </div>

                    {partner.email && (
                      <div className="mt-1 text-xs text-gray-500">
                        {partner.email}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {partner.contact_person ?? "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {partner.partner_contributions.length}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        partner.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {partner.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/Partners/${partner.id}/edit`}
                        className="text-sm font-medium text-black hover:underline"
                      >
                        Edit
                      </Link>

                      <form action={deletePartner}>
                        <input type="hidden" name="id" value={partner.id} />

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

              {partners.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No partners found.
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
