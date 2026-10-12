
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function AssessmentsPage() {
  const [assessments, resultCounts] = await Promise.all([
    prisma.assessments.findMany({
      include: {
        questions: true,
        campaigns: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),

    prisma.assessment_attempts.groupBy({
      by: ["assessment_id", "result"],
      where: {
        result: { not: null },
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const countsByAssessment = new Map<
    string,
    { eligible: number; notEligible: number; needsReview: number }
  >()

  for (const row of resultCounts) {
    const entry = countsByAssessment.get(row.assessment_id) ?? {
      eligible: 0,
      notEligible: 0,
      needsReview: 0,
    }

    if (row.result === "ELIGIBLE") {
      entry.eligible = row._count._all
    } else if (row.result === "NOT_ELIGIBLE") {
      entry.notEligible = row._count._all
    } else if (row.result === "NEEDS_REVIEW") {
      entry.needsReview = row._count._all
    }

    countsByAssessment.set(row.assessment_id, entry)
  }

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
                  Eligible
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Not Eligible
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Needs Review
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
              {assessments.map((assessment) => {
                const counts = countsByAssessment.get(assessment.id) ?? {
                  eligible: 0,
                  notEligible: 0,
                  needsReview: 0,
                }

                return (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {assessment.title}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {assessment.description ?? "No description"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assessment.questions.length}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assessment.campaigns.length}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        {counts.eligible}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        {counts.notEligible}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        {counts.needsReview}
                      </span>
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

