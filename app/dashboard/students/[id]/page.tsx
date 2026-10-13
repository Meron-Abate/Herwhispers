import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type StudentDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const student = await prisma.students.findUnique({
    where: { id },
    include: {
      universities: true,
      participants: {
        include: {
          campaigns: true,
        },
        orderBy: { registered_at: "desc" },
      },
      assessment_attempts: {
        include: {
          assessments: true,
          campaigns: true,
        },
        orderBy: { started_at: "desc" },
      },
    },
  })

  if (!student) {
    notFound()
  }

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
    "Unnamed student"

  const field = (label: string, value: string | null | undefined) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">—</span>}
      </p>
    </div>
  )

  return (
    <div className="p-8">
      <Link
        href="/dashboard/students"
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Back to Students
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>

          <p className="mt-1 text-sm text-gray-500">
            Student details and activity
          </p>
        </div>

        <Link
          href={`/dashboard/students/${student.id}/edit`}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Edit Student
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Profile
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Telegram ID", String(student.telegram_id))}
            {field(
              "Telegram username",
              student.telegram_username
                ? `@${student.telegram_username}`
                : null
            )}
            {field("Phone", student.phone)}
            {field("University", student.universities?.name)}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Status
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Status", student.status)}
            {field(
              "Created",
              student.created_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
            {field(
              "Updated",
              student.updated_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
            {field(
              "Campaigns joined",
              String(student.participants.length)
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Assessment Attempts
          </h2>

          {student.assessment_attempts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No assessment attempts yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {student.assessment_attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {attempt.assessments.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Score {attempt.total_score}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      attempt.result === "ELIGIBLE"
                        ? "bg-green-100 text-green-700"
                        : attempt.result === "NOT_ELIGIBLE"
                          ? "bg-red-100 text-red-700"
                          : attempt.result === "NEEDS_REVIEW"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {attempt.result?.replaceAll("_", " ") ?? "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Campaign Participation
          </h2>
        </div>

        {student.participants.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            This student has not joined any campaigns yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Campaign
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Participant code
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Registered
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {student.participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-6 py-3 text-gray-900">
                    {participant.campaigns.name}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {participant.participant_code}
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                      {participant.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {participant.registered_at.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
