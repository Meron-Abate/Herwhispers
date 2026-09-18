import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type NewRulePageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function NewRulePage({
  params,
}: NewRulePageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const assessment =
    await prisma.assessments.findUnique({
      where: {
        id,
      },
      include: {
        eligibility_rules: {
          orderBy: {
            priority: "desc",
          },
          take: 1,
        },
      },
    })

  if (!assessment) {
    notFound()
  }

  const nextPriority =
    (assessment.eligibility_rules[0]?.priority ?? 0) + 1

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

        <Link
          href={`/dashboard/assessments/${id}`}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back to Assessment
        </Link>

        <div className="mt-6 max-w-3xl">

          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
              ELIGIBILITY RULE
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment Builder
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Add Eligibility Rule
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Define how assessment scores should be converted into
            eligibility results.
          </p>

        </div>


        <div className="mt-8 max-w-3xl">

          <form
            action="/api/assessments/rules"
            method="POST"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >

            <input
              type="hidden"
              name="assessment_id"
              value={id}
            />

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-lg font-bold text-slate-900">
                Rule Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Set the score range and result for this rule.
              </p>

            </div>

            <div className="space-y-7 p-6">

              {/* Name */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Rule Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Example: Eligible"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

              </div>


              {/* Score Range */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Score Range
                </label>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>

                    <label
                      htmlFor="minimum_score"
                      className="mb-2 block text-xs font-medium text-slate-500"
                    >
                      Minimum Score
                    </label>

                    <input
                      id="minimum_score"
                      name="minimum_score"
                      type="number"
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />

                  </div>


                  <div>

                    <label
                      htmlFor="maximum_score"
                      className="mb-2 block text-xs font-medium text-slate-500"
                    >
                      Maximum Score
                    </label>

                    <input
                      id="maximum_score"
                      name="maximum_score"
                      type="number"
                      placeholder="100"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />

                  </div>

                </div>

              </div>


              {/* Result */}

              <div>

                <label
                  htmlFor="result"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Assessment Result
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="result"
                  name="result"
                  required
                  defaultValue="ELIGIBLE"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="ELIGIBLE">
                    Eligible
                  </option>

                  <option value="NEEDS_REVIEW">
                    Needs Review
                  </option>

                  <option value="NOT_ELIGIBLE">
                    Not Eligible
                  </option>
                </select>

              </div>


              {/* Reason */}

              <div>

                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Reason
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  placeholder="Explain why this score range produces this result..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

              </div>


              {/* Priority */}

              <div>

                <label
                  htmlFor="priority"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Priority
                </label>

                <input
                  id="priority"
                  name="priority"
                  type="number"
                  min="1"
                  required
                  defaultValue={nextPriority}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Lower priority numbers are evaluated first.
                </p>

              </div>

            </div>


            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">

              <Link
                href={`/dashboard/assessments/${id}`}
                className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <span>+</span>
                Create Eligibility Rule
              </button>

            </div>

          </form>

        </div>

      </div>
    </div>
  )
}