import { prisma } from "@/lib/prisma"
import PageHeader from "@/app/dashboard/PageHeader"
import {
  assignHealthQuestion,
  createDoctor,
  setStoryStatus,
  toggleDoctor,
} from "@/app/actions/health"

export const dynamic = "force-dynamic"

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
}

export default async function HealthPage() {
  const [questions, doctors, categories, stories] = await Promise.all([
    prisma.health_questions.findMany({
      include: { health_categories: true, doctors: true },
      orderBy: { created_at: "desc" },
      take: 100,
    }),
    prisma.doctors.findMany({
      include: { health_categories: true },
      orderBy: { full_name: "asc" },
    }),
    prisma.health_categories.findMany({
      where: { is_active: true },
      orderBy: { sort_order: "asc" },
    }),
    prisma.anonymous_stories.findMany({
      include: { health_categories: true },
      orderBy: { created_at: "desc" },
      take: 100,
    }),
  ])

  const activeDoctors = doctors.filter((doctor) => doctor.is_active)

  return (
    <div className="p-8">
      <PageHeader
        title="Health"
        description="Assign doctors to health questions and review anonymous stories"
      />

      {/* Questions */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Questions ({questions.length})
      </h2>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Doctor
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {questions.map((question) => (
              <tr key={question.id} className="align-top hover:bg-violet-50/40">
                <td className="max-w-md whitespace-pre-wrap px-6 py-4 text-sm text-gray-900">
                  {question.question_text}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {question.health_categories.name}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                    {question.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  {question.status === "ANSWERED" ? (
                    <span className="text-gray-600">
                      {question.doctors?.full_name ?? "—"}
                    </span>
                  ) : (
                    <form
                      action={assignHealthQuestion}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="question_id"
                        value={question.id}
                      />

                      <select
                        name="doctor_id"
                        required
                        defaultValue={question.assigned_doctor_id ?? ""}
                        className="rounded-lg border px-2 py-1.5 text-sm"
                      >
                        <option value="" disabled>
                          Select doctor
                        </option>
                        {activeDoctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.full_name}
                            {doctor.health_categories
                              ? ` (${doctor.health_categories.name})`
                              : ""}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                      >
                        {question.assigned_doctor_id ? "Reassign" : "Assign"}
                      </button>
                    </form>
                  )}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(question.created_at).toLocaleDateString(
                    "en-GB",
                    dateFormat
                  )}
                </td>
              </tr>
            ))}

            {questions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No questions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Doctors */}
      <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-900">
        Doctors ({doctors.length})
      </h2>

      <form
        action={createDoctor}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm"
      >
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Name</span>
          <input
            name="full_name"
            required
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Telegram ID</span>
          <input
            name="telegram_id"
            inputMode="numeric"
            placeholder="e.g. 123456789"
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Specialty</span>
          <select
            name="category_id"
            defaultValue=""
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          + Add doctor
        </button>
      </form>

      <p className="mb-3 text-xs text-gray-500">
        A doctor can only receive questions in Telegram if their Telegram ID is
        set. They can find it by messaging @userinfobot, and must have started
        the bot first.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Specialty
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Telegram ID
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-violet-50/40">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {doctor.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {doctor.health_categories?.name ?? "Any"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {doctor.telegram_id?.toString() ?? (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      doctor.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {doctor.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <form action={toggleDoctor}>
                    <input type="hidden" name="id" value={doctor.id} />
                    <button
                      type="submit"
                      className="font-medium text-black hover:underline"
                    >
                      {doctor.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {doctors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No doctors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stories */}
      <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-900">
        Anonymous stories ({stories.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-violet-700">
                  {story.health_categories.name}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                  {story.status}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-900">
                {story.story_text}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-xs text-gray-500">
                {new Date(story.created_at).toLocaleDateString(
                  "en-GB",
                  dateFormat
                )}
              </span>

              <div className="flex gap-3 text-sm">
                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={story.id} />
                  <input type="hidden" name="status" value="APPROVED" />
                  <button
                    type="submit"
                    className="font-medium text-green-700 hover:underline"
                  >
                    Approve
                  </button>
                </form>

                <form action={setStoryStatus}>
                  <input type="hidden" name="id" value={story.id} />
                  <input type="hidden" name="status" value="REJECTED" />
                  <button
                    type="submit"
                    className="font-medium text-red-600 hover:underline"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {stories.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
            No stories yet.
          </div>
        )}
      </div>
    </div>
  )
}
