import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type AssessmentPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function getResultStyles(result: string) {
  switch (result) {
    case "ELIGIBLE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"

    case "NEEDS_REVIEW":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"

    case "NOT_ELIGIBLE":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"

    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200"
  }
}

function getResultDot(result: string) {
  switch (result) {
    case "ELIGIBLE":
      return "bg-emerald-500"

    case "NEEDS_REVIEW":
      return "bg-amber-500"

    case "NOT_ELIGIBLE":
      return "bg-red-500"

    default:
      return "bg-gray-400"
  }
}

function formatResult(result: string) {
  return result.replaceAll("_", " ")
}

export default async function AssessmentPage({
  params,
}: AssessmentPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const assessment = await prisma.assessments.findUnique({
    where: {
      id,
    },

    include: {
      questions: {
        include: {
          answer_options: true,
        },

        orderBy: {
          order_index: "asc",
        },
      },

      eligibility_rules: {
        orderBy: {
          priority: "asc",
        },
      },
    },
  })

  if (!assessment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

        {/* ========================================= */}
        {/* PAGE HEADER */}
        {/* ========================================= */}

        <div className="mb-8">

          <Link
            href="/dashboard/assessments"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Back to Assessments
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-3 flex flex-wrap items-center gap-3">

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ACTIVE
                </span>

                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Assessment
                </span>

              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {assessment.title}
              </h1>

              {assessment.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  {assessment.description}
                </p>
              )}

            </div>

            <Link
              href={`/dashboard/assessments/${assessment.id}/questions/new`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <span className="text-lg leading-none">
                +
              </span>

              Add Question
            </Link>

          </div>
        </div>


        {/* ========================================= */}
        {/* QUICK STATS */}
        {/* ========================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Questions
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {assessment.questions.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg">
                ?
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-500">
              Questions configured in this assessment
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Eligibility Rules
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {assessment.eligibility_rules.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg">
                ✓
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-500">
              Rules used to determine eligibility
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-600">
                  Active
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-500">
              This assessment is currently available
            </p>

          </div>

        </div>


        {/* ========================================= */}
        {/* QUESTIONS */}
        {/* ========================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Section Header */}

          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <h2 className="text-lg font-bold text-slate-900">
                  Assessment Questions
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {assessment.questions.length}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Questions students will answer during registration.
              </p>

            </div>

            <Link
              href={`/dashboard/assessments/${assessment.id}/questions/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="text-base">
                +
              </span>

              Add Question
            </Link>

          </div>


          {/* Empty State */}

          {assessment.questions.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
                ?
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No questions yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Add questions to define what students will be asked during the eligibility assessment.
              </p>

              <Link
                href={`/dashboard/assessments/${assessment.id}/questions/new`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add First Question
              </Link>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {assessment.questions.map((question, index) => (

                <div
                  key={question.id}
                  className="p-6 transition hover:bg-slate-50/70"
                >

                  {/* Question Header */}

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Question {index + 1}
                        </p>

                        <h3 className="mt-1 text-base font-semibold leading-6 text-slate-900">
                          {question.prompt}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">

                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {question.type.replaceAll("_", " ")}
                          </span>

                          {question.is_required ? (
                            <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                              Required
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              Optional
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* Answer Options */}

                  {question.answer_options.length > 0 ? (

                    <div className="mt-5 ml-0 lg:ml-14">

                      <div className="mb-2 flex items-center justify-between">

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Answer Options
                        </p>

                        <p className="text-xs text-slate-400">
                          {question.answer_options.length} option
                          {question.answer_options.length === 1 ? "" : "s"}
                        </p>

                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200">

                        {question.answer_options.map((option) => (

                          <div
                            key={option.id}
                            className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3.5 last:border-b-0 transition hover:bg-slate-50"
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                •
                              </div>

                              <span className="truncate text-sm font-medium text-slate-700">
                                {option.label}
                              </span>

                              {option.is_disqualifier && (
                                <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                                  Disqualifier
                                </span>
                              )}

                            </div>

                            <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {option.score_weight} pts
                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  ) : (

                    <div className="mt-5 ml-0 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 lg:ml-14">

                      <p className="text-sm text-slate-500">
                        No answer options configured for this question.
                      </p>

                    </div>

                  )}


                  {/* Add Option */}

                  <div className="mt-4 ml-0 lg:ml-14">

                    <Link
                      href={`/dashboard/assessments/${assessment.id}/questions/${question.id}/options/new`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                    >
                      <span className="text-base">
                        +
                      </span>

                      Add Answer Option
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* ========================================= */}
        {/* ELIGIBILITY RULES */}
        {/* ========================================= */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}

          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <h2 className="text-lg font-bold text-slate-900">
                  Eligibility Rules
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {assessment.eligibility_rules.length}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Rules used to determine the student's eligibility result.
              </p>

            </div>

            <Link
              href={`/dashboard/assessments/${assessment.id}/rules/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
            >
              <span className="text-base">
                +
              </span>

              Add Rule
            </Link>

          </div>


          {/* Rules */}

          {assessment.eligibility_rules.length === 0 ? (

            <div className="px-6 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg text-slate-500">
                ✓
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No eligibility rules
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                Add rules to tell HerWhispers how assessment scores should be interpreted.
              </p>

              <Link
                href={`/dashboard/assessments/${assessment.id}/rules/new`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add First Rule
              </Link>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Rule
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Score Range
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Result
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                      Reason
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {assessment.eligibility_rules.map((rule) => (

                    <tr
                      key={rule.id}
                      className="group transition hover:bg-slate-50"
                    >

                      {/* Rule */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                            {rule.priority}
                          </div>

                          <div>

                            <p className="font-semibold text-slate-900">
                              {rule.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Priority {rule.priority}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Score */}

                      <td className="px-6 py-5">

                        <div className="inline-flex items-center rounded-lg bg-slate-50 px-3 py-2">

                          <span className="font-semibold text-slate-700">
                            {rule.minimum_score ?? "—"}
                          </span>

                          <span className="mx-2 text-slate-300">
                            →
                          </span>

                          <span className="font-semibold text-slate-700">
                            {rule.maximum_score ?? "—"}
                          </span>

                        </div>

                      </td>


                      {/* Result */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getResultStyles(
                            rule.result
                          )}`}
                        >

                          <span
                            className={`h-1.5 w-1.5 rounded-full ${getResultDot(
                              rule.result
                            )}`}
                          />

                          {formatResult(rule.result)}

                        </span>

                      </td>


                      {/* Reason */}

                      <td className="max-w-xs px-6 py-5">

                        {rule.reason ? (
                          <p className="text-sm leading-5 text-slate-500">
                            {rule.reason}
                          </p>
                        ) : (
                          <span className="text-sm text-slate-300">
                            No reason provided
                          </span>
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ========================================= */}
        {/* BOTTOM INFO */}
        {/* ========================================= */}

        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <p>
            Assessment ID: {assessment.id}
          </p>

          <Link
            href="/dashboard/assessments"
            className="font-medium text-slate-500 hover:text-slate-900"
          >
            ← All Assessments
          </Link>

        </div>

      </div>
    </div>
  )
}