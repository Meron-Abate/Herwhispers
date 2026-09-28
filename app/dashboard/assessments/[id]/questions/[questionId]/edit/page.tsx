import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EditQuestionForm from "./EditQuestionForm"

type EditQuestionPageProps = {
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

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { id, questionId } = await params

  if (!isValidUUID(id) || !isValidUUID(questionId)) {
    notFound()
  }

  const question = await prisma.questions.findFirst({
    where: {
      id: questionId,
      assessment_id: id,
    },
  })

  if (!question) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/assessments/${id}`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Assessment
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Question
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Update the question text, question type, or required status.
          </p>
        </div>

<EditQuestionForm
  assessmentId={id}
  question={{
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    is_required: question.is_required,
    order_index: question.order_index,
  }}
/>      </div>
    </main>
  )
}