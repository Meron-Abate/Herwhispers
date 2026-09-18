import { prisma } from "@/lib/prisma"

export default async function UniversitiesPage() {
  const universities = await prisma.universities.findMany({
    include: {
      students: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Universities
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage participating universities
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                University
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Students
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {universities.map((university) => (
              <tr key={university.id}>
                <td className="px-6 py-4 text-sm font-medium">
                  {university.name}
                </td>

                <td className="px-6 py-4 text-sm">
                  {university.students.length}
                </td>
              </tr>
            ))}

            {universities.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No universities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}