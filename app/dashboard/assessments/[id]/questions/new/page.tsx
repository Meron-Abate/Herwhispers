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

function resultBadge(result: string) {
  if (result === "ELIGIBLE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  }

  if (result === "NOT_ELIGIBLE") {
    return "bg-red-50 text-red-700 ring-red-200"
  }

  return "bg-amber-50 text-amber-700 ring-amber-200"
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
          answer_options: {
            orderBy: {
              score_weight: "desc",
            },
          },
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
      campaigns: true,
      assessment_attempts: true,
    },
  })

  if (!assessment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/dashboard/assessments"
              className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>
              Back to Assessments
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                ASSESSMENT
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                  assessment.is_active
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-500 ring-slate-200"
                }`}
              >
                {assessment.is_active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {assessment.title}
            </h1>

            {assessment.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                {assessment.description}
              </p>
            )}
          </div>

          <Link
            href={`/dashboard/assessments/${assessment.id}/questions/new`}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
          >
            + Add Question
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assessment.questions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Answer Options
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assessment.questions.reduce(
                (total, question) =>
                  total + question.answer_options.length,
                0
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Eligibility Rules
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assessment.eligibility_rules.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Campaigns
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assessment.campaigns.length}
            </p>
          </div>

        </div>

        {/* Questions */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Assessment Questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure the questions students will answer.
              </p>
            </div>

            <Link
              href={`/dashboard/assessments/${assessment.id}/questions/new`}
              className="hidden text-sm font-semibold text-slate-700 hover:text-slate-950 sm:block"
            >
              + Add Question
            </Link>
          </div>

          {assessment.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold text-slate-800">
                No questions yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first question to begin building this assessment.
              </p>

              <Link
                href={`/dashboard/assessments/${assessment.id}/questions/new`}
                className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + Add First Question
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {assessment.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Question {index + 1}
                        </p>

                        <h3 className="mt-1 text-base font-bold text-slate-900">
                          {question.prompt}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {question.type.replaceAll("_", " ")}
                          </span>

                          {question.is_required && (
                            <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/assessments/${assessment.id}/questions/${question.id}/options/new`}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      + Add Option
                    </Link>
                  </div>

                  {question.answer_options.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Answer
                            </th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Score
                            </th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Type
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {question.answer_options.map((option) => (
                            <tr
                              key={option.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {option.label}
                              </td>

                              <td className="px-6 py-4">
                                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                  {option.score_weight} pts
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                {option.is_disqualifier ? (
                                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
                                    Disqualifier
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-slate-400">
                                    Standard
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-6">
                      <p className="text-sm text-slate-400">
                        No answer options configured.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Eligibility Rules */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Eligibility Rules
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define how assessment scores become eligibility results.
              </p>
            </div>

            <Link
              href={`/dashboard/assessments/${assessment.id}/rules/new`}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Add Rule
            </Link>
          </div>

          {assessment.eligibility_rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                No eligibility rules configured yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Priority
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Rule
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Score Range
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Result
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {assessment.eligibility_rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {rule.priority}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">
                            {rule.name}
                          </p>

                          {rule.reason && (
                            <p className="mt-1 max-w-md text-xs text-slate-400">
                              {rule.reason}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                          {rule.minimum_score ?? "—"} →{" "}
                          {rule.maximum_score ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${resultBadge(
                              rule.result
                            )}`}
                          >
                            {rule.result.replaceAll("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}