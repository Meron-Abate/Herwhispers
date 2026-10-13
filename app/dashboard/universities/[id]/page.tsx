import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type UniversityDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function UniversityDetailPage({
  params,
}: UniversityDetailPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const university = await prisma.universities.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: { created_at: "desc" },
      },
      assessment_universities: {
        include: {
          assessments: true,
        },
      },
    },
  })

  if (!university) {
    notFound()
  }

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
        href="/dashboard/universities"
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Back to Universities
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {university.name}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            University details and enrolled students
          </p>
        </div>

        <Link
          href={`/dashboard/universities/${university.id}/edit`}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Edit University
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Code", university.code)}
            {field(
              "Status",
              university.is_active ? "ACTIVE" : "INACTIVE"
            )}
            {field(
              "Created",
              university.created_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
            {field(
              "Updated",
              university.updated_at.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Students
          </h2>

          <p className="text-3xl font-bold text-gray-900">
            {university.students.length}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Enrolled at this university
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Linked Assessments
          </h2>

          {university.assessment_universities.length === 0 ? (
            <p className="text-sm text-gray-500">
              No assessments linked yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {university.assessment_universities.map((link) => (
                <li
                  key={link.assessment_id}
                  className="text-sm text-gray-900"
                >
                  {link.assessments.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Enrolled Students
          </h2>
        </div>

        {university.students.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            No students are enrolled at this university yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Telegram
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Phone
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700">
                  Joined
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {university.students.map((student) => {
                const fullName =
                  [student.first_name, student.last_name]
                    .filter(Boolean)
                    .join(" ") || "Unnamed student"

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {student.telegram_username
                        ? `@${student.telegram_username}`
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {student.phone ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {student.created_at.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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
