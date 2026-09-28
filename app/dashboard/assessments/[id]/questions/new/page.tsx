
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

type NewQuestionPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function createQuestion(formData: FormData) {
  "use server"

  const assessmentId = String(formData.get("assessmentId") || "")
  const prompt = String(formData.get("prompt") || "").trim()
  const type = String(formData.get("type") || "SINGLE_CHOICE")
  const isRequired = formData.get("isRequired") === "on"

  if (!isValidUUID(assessmentId)) {
    throw new Error("Invalid assessment ID.")
  }

  if (!prompt) {
    throw new Error("Question text is required.")
  }

  if (
    type !== "SINGLE_CHOICE" &&
    type !== "MULTIPLE_CHOICE" &&
    type !== "NUMBER"
  ) {
    throw new Error("Invalid question type.")
  }

  const assessment = await prisma.assessments.findUnique({
    where: {
      id: assessmentId,
    },
    select: {
      id: true,
    },
  })

  if (!assessment) {
    notFound()
  }

  const lastQuestion = await prisma.questions.findFirst({
    where: {
      assessment_id: assessmentId,
    },
    orderBy: {
      order_index: "desc",
    },
    select: {
      order_index: true,
    },
  })

  const nextOrderIndex = (lastQuestion?.order_index ?? 0) + 1

  await prisma.questions.create({
    data: {
      assessment_id: assessmentId,
      prompt,
      type,
      order_index: nextOrderIndex,
      is_required: isRequired,
    },
  })

  redirect(`/dashboard/assessments/${assessmentId}`)
}

export default async function NewQuestionPage({
  params,
}: NewQuestionPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const assessment = await prisma.assessments.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  })

  if (!assessment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/assessments/${assessment.id}`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Back to Assessment
          </Link>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Add Question
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Create a New Question
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              Add a question that students will answer as part of the{" "}
              <span className="font-semibold text-slate-700">
                {assessment.title}
              </span>{" "}
              assessment.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl">
          <form
            action={createQuestion}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <input
              type="hidden"
              name="assessmentId"
              value={assessment.id}
            />

            <div className="space-y-7 p-6 md:p-8">

              {/* Question */}
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-bold text-slate-800"
                >
                  Question
                </label>

                <p className="mt-1 text-sm text-slate-500">
                  Write the question exactly as the student should see it.
                </p>

                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  required
                  placeholder="Example: What is your current level of study?"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Question Type */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-bold text-slate-800"
                >
                  Question Type
                </label>

                <p className="mt-1 text-sm text-slate-500">
                  Choose how the student will answer this question.
                </p>

                <select
                  id="type"
                  name="type"
                  defaultValue="SINGLE_CHOICE"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="SINGLE_CHOICE">
                    Single Choice
                  </option>

                  <option value="MULTIPLE_CHOICE">
                    Multiple Choice
                  </option>

                  <option value="NUMBER">
                    Number
                  </option>
                </select>
              </div>

              {/* Required */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="isRequired"
                    defaultChecked
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      Required question
                    </span>

                    <span className="mt-1 block text-sm text-slate-500">
                      Students must answer this question before continuing.
                    </span>
                  </span>
                </label>
              </div>

              {/* Information */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Answer options
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  For Single Choice and Multiple Choice questions, you can add
                  the answer options after creating the question.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:justify-end">
              <Link
                href={`/dashboard/assessments/${assessment.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Create Question
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}

