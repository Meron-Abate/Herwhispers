import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { deleteStudent } from "@/app/actions/students"

export default async function StudentsPage() {
  const students = await prisma.students.findMany({
    include: {
      universities: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Students
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage registered students
            {students.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {students.length}
              </span>
            )}
          </p>
        </div>

        <Link
          href="/dashboard/students/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New Student
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Name
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Telegram username
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Phone
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                University
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
              const fullName = [student.first_name, student.last_name]
                .filter(Boolean)
                .join(" ")
              const displayName = fullName || "Unnamed student"
              const initials = fullName
                ? fullName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "•"

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {initials}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {displayName}
                        </p>
                        {!fullName && (
                          <p className="text-xs text-gray-400">
                            Telegram ID {String(student.telegram_id)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.telegram_username ? (
                      `@${student.telegram_username}`
                    ) : (
                      <span className="text-gray-400">Not linked</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.phone ?? (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.universities?.name ?? (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {student.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(student.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/students/${student.id}/edit`}
                        className="font-medium text-black hover:underline"
                      >
                        Edit
                      </Link>

                      <form action={deleteStudent}>
                        <input type="hidden" name="id" value={student.id} />

                        <button
                          type="submit"
                          className="font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-sm font-medium text-gray-900">
                    No students found.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Students will appear here once they register via Telegram.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}