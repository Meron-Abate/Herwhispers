import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { deleteUniversity } from "@/app/actions/universities"

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
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Universities
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage participating universities
          </p>
        </div>

        <Link
          href="/dashboard/universities/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New University
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                University
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Code
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Students
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Status
              </th>

              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {universities.map((university) => (
              <tr key={university.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {university.name}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {university.code}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {university.students.length}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      university.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {university.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/dashboard/universities/${university.id}/edit`}
                      className="font-medium text-black hover:underline"
                    >
                      Edit
                    </Link>

                    <form action={deleteUniversity}>
                      <input type="hidden" name="id" value={university.id} />

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
            ))}

            {universities.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
