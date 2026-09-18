import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type NewOptionPageProps = {
  params: Promise<{
    id: string
    questionId: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function NewOptionPage({
  params,
}: NewOptionPageProps) {
  const { id, questionId } = await params

  if (
    !isValidUUID(id) ||
    !isValidUUID(questionId)
  ) {
    notFound()
  }

  const question =
    await prisma.questions.findFirst({
      where: {
        id: questionId,
        assessment_id: id,
      },
    })

  if (!question) {
    notFound()
  }

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
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
              ANSWER OPTION
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment Builder
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Add Answer Option
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
            Create an answer and define how it contributes to the
            student's assessment score.
          </p>

        </div>


        {/* Question Context */}

        <div className="mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Question
          </p>

          <div className="mt-3 flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              ?
            </div>

            <p className="text-base font-semibold leading-6 text-slate-900">
              {question.prompt}
            </p>

          </div>

        </div>


        {/* Form */}

        <div className="mt-6 max-w-3xl">

          <form
            action="/api/assessments/options"
            method="POST"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >

            <input
              type="hidden"
              name="assessment_id"
              value={id}
            />

            <input
              type="hidden"
              name="question_id"
              value={questionId}
            />

            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">
                Option Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure the answer students can select.
              </p>
            </div>

            <div className="space-y-7 p-6">

              {/* Label */}

              <div>

                <label
                  htmlFor="label"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Answer Label
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="label"
                  name="label"
                  type="text"
                  required
                  placeholder="Example: Undergraduate"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  This is the answer students will see.
                </p>

              </div>


              {/* Score */}

              <div>

                <label
                  htmlFor="score_weight"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Score Weight
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">

                  <input
                    id="score_weight"
                    name="score_weight"
                    type="number"
                    required
                    defaultValue="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    POINTS
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Points added to the student's total assessment score.
                </p>

              </div>


              {/* Disqualifier */}

              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">

                <label className="flex cursor-pointer gap-3">

                  <input
                    id="is_disqualifier"
                    name="is_disqualifier"
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />

                  <span>

                    <span className="block text-sm font-semibold text-slate-800">
                      Disqualifying answer
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Selecting this answer will make the assessment
                      result NOT ELIGIBLE.
                    </span>

                  </span>

                </label>

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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
              >
                <span>+</span>
                Create Answer Option
              </button>

            </div>

          </form>

        </div>

      </div>
    </div>
  )
}