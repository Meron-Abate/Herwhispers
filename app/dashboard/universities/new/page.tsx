import Link from "next/link"
import { createUniversity } from "@/app/actions/universities"

export default function NewUniversityPage() {
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
          Add University
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Register a new participating university.
        </p>
      </div>

      <form
        action={createUniversity}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
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
            placeholder="e.g. Addis Ababa University"
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
            placeholder="e.g. AAU"
            className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
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
          Add University
        </button>
      </form>
    </div>
  )
}
