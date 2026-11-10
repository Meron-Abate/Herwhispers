import Link from "next/link"
import { prisma } from "@/lib/prisma"
import StatusBadge from "@/app/dashboard/StatusBadge"
import DeleteStudentButton from "./DeleteStudentButton"

export default async function StudentsPage() {
  const students = await prisma.students.findMany({
    include: {
      universities: true,
      participants: { select: { id: true } },
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Students
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Everyone who has used the bot, verified or not
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">All students</p>
            <p className="text-xl font-bold text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Participants</p>
            <p className="text-xl font-bold text-emerald-600">
              {students.filter((student) => student.participants.length > 0).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Not verified</p>
            <p className="text-xl font-bold text-amber-600">
              {students.filter((student) => student.participants.length === 0).length}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Telegram username
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                University
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registration
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <tr key={student.id} className="hover:bg-violet-50/40">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {initials}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="hover:underline"
                          >
                            {displayName}
                          </Link>
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      {student.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <StatusBadge
                      status={
                        student.participants.length > 0
                          ? "PARTICIPANT"
                          : "NOT VERIFIED"
                      }
                      tone={
                        student.participants.length > 0 ? "success" : "warning"
                      }
                    />
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

                      <DeleteStudentButton
                        studentId={student.id}
                        studentName={displayName}
                      />
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