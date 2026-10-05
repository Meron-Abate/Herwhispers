import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateUniversity } from "@/app/actions/universities"

type EditUniversityPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditUniversityPage({
  params,
}: EditUniversityPageProps) {
  const { id } = await params

  const university = await prisma.universities.findUnique({
    where: { id },
  })

  if (!university) {
    notFound()
  }

  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/universities"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back to Universities
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Edit University
        </h1>
      </div>

      <form
        action={updateUniversity}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={university.id} />

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            University name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={university.name}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Code
          </label>

          <input
            id="code"
            name="code"
            type="text"
            required
            defaultValue={university.code}
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={university.is_active}
            className="h-4 w-4"
          />

          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active and accepting students
          </label>
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
