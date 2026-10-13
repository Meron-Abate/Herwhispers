import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateStudent } from "@/app/actions/students"

type EditStudentPageProps = {
  params: Promise<{
    id: string
  }>
}


function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default async function EditStudentPage({
  params,
}: EditStudentPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const [student, universities] = await Promise.all([
    prisma.students.findUnique({
      where: { id },
    }),
    prisma.universities.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!student) {
    notFound()
  }

  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/students"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Students
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Edit Student
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Telegram ID {String(student.telegram_id)} cannot be changed.
        </p>
      </div>

      <form
        action={updateStudent}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={student.id} />

        <div>
          <label
            htmlFor="telegram_username"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Telegram username
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <input
            id="telegram_username"
            name="telegram_username"
            type="text"
            defaultValue={student.telegram_username ?? ""}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="first_name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              First name
              <span className="ml-2 text-xs font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              defaultValue={student.first_name ?? ""}
              className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Last name
              <span className="ml-2 text-xs font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              defaultValue={student.last_name ?? ""}
              className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Phone
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={student.phone ?? ""}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="university_id"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            University
            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <select
            id="university_id"
            name="university_id"
            defaultValue={student.university_id ?? ""}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          >
            <option value="">Not assigned</option>

            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
