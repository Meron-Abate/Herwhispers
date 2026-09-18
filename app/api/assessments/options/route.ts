import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const assessmentId = String(
      formData.get("assessment_id") ?? ""
    ).trim()

    const questionId = String(
      formData.get("question_id") ?? ""
    ).trim()

    const label = String(
      formData.get("label") ?? ""
    ).trim()

    const scoreValue = String(
      formData.get("score_weight") ?? "0"
    ).trim()

    const isDisqualifier =
      formData.get("is_disqualifier") === "on"

    if (
      !isValidUUID(assessmentId) ||
      !isValidUUID(questionId)
    ) {
      return NextResponse.json(
        { error: "Invalid IDs." },
        { status: 400 }
      )
    }

    if (!label) {
      return NextResponse.json(
        { error: "Answer label is required." },
        { status: 400 }
      )
    }

    const scoreWeight = Number(scoreValue)

    if (!Number.isInteger(scoreWeight)) {
      return NextResponse.json(
        { error: "Score must be a whole number." },
        { status: 400 }
      )
    }

    const question =
      await prisma.questions.findFirst({
        where: {
          id: questionId,
          assessment_id: assessmentId,
        },
      })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 }
      )
    }

    await prisma.answer_options.create({
      data: {
        question_id: questionId,
        label,
        score_weight: scoreWeight,
        is_disqualifier: isDisqualifier,
      },
    })

    return NextResponse.redirect(
      new URL(
        `/dashboard/assessments/${assessmentId}`,
        request.url
      ),
      303
    )
  } catch (error) {
    console.error(
      "ANSWER OPTION CREATION ERROR:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to create answer option.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}