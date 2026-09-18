
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AssessmentsPage() {
  const assessments = await prisma.assessments.findMany({
    include: {
      questions: true,
      campaigns: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assessments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage eligibility assessments used for HerWhispers campaigns.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {assessments.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No assessments found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create an assessment before creating a campaign.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Assessment
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Questions
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Campaigns
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {assessment.title}
                      </p>

                      {assessment.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {assessment.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {assessment.questions.length}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {assessment.campaigns.length}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        assessment.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {assessment.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {assessment.created_at.toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/assessments/${assessment.id}`}
                      className="text-sm font-medium text-black hover:underline"
                    >
                      Manage
                    </Link>
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

