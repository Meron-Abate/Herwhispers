import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type PageProps = {
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

export default async function QuestionDetailPage({
  params,
}: PageProps) {
  const { id, questionId } = await params

  if (!isValidUUID(id) || !isValidUUID(questionId)) {
    notFound()
  }

  const question = await prisma.questions.findFirst({
    where: {
      id: questionId,
      assessment_id: id,
    },
    include: {
      answer_options: true,
    },
  })

  if (!question) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <div className="mb-6">
          <Link
            href={`/dashboard/assessments/${id}`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Assessment
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              Question {question.order_index}
            </p>

            <h1 className="text-2xl font-bold text-gray-900">
              Question Details
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              View and manage this assessment question.
            </p>
          </div>

          <Link
            href={`/dashboard/assessments/${id}/questions/${question.id}/edit`}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Edit Question
          </Link>
        </div>

        {/* Question */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Question
          </p>

          <h2 className="text-lg font-semibold text-gray-900">
            {question.prompt}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">
                Question Type
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {question.type.replaceAll("_", " ")}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">
                Required
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {question.is_required ? "Yes" : "No"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">
                Order
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {question.order_index}
              </p>
            </div>

          </div>
        </div>

        {/* Options */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Answer Options
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage the answer choices and their scores.
              </p>
            </div>

            <Link
              href={`/dashboard/assessments/${id}/questions/${question.id}/options/new`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Add Option
            </Link>
          </div>

          {question.answer_options.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No answer options yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add an option if this question uses predefined answers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {question.answer_options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {option.label}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Score: {option.score_weight}
                    </p>
                  </div>

                  {option.is_disqualifier && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      Disqualifier
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}