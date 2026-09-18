import { prisma } from "@/lib/prisma"

export default async function StudentsPage() {
  const students = await prisma.students.findMany({
    include: {
      universities: true,
      participants: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Students
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage registered students
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Name
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                University
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Email
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Participants
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 text-sm font-medium">
                  {student.first_name} {student.last_name}
                </td>

                <td className="px-6 py-4 text-sm">
                  {student.universities?.name ?? "—"}
                </td>

                <td className="px-6 py-4 text-sm">
                  {student.email ?? "—"}
                </td>

                <td className="px-6 py-4 text-sm">
                  {student.participants.length}
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}