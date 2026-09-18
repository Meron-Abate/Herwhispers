import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const attemptId = String(
      body.attemptId ?? ""
    ).trim()

    const questionId = String(
      body.questionId ?? ""
    ).trim()

    const answerOptionId = body.answerOptionId
      ? String(body.answerOptionId)
      : null

    const numberValue =
      body.numberValue !== undefined &&
      body.numberValue !== null &&
      body.numberValue !== ""
        ? Number(body.numberValue)
        : null

    if (!attemptId || !questionId) {
      return NextResponse.json(
        {
          error:
            "attemptId and questionId are required.",
        },
        { status: 400 }
      )
    }

    const attempt =
      await prisma.assessment_attempts.findUnique({
        where: {
          id: attemptId,
        },
      })

    if (!attempt) {
      return NextResponse.json(
        {
          error: "Assessment attempt not found.",
        },
        { status: 404 }
      )
    }

    const question =
      await prisma.questions.findUnique({
        where: {
          id: questionId,
        },
      })

    if (!question) {
      return NextResponse.json(
        {
          error: "Question not found.",
        },
        { status: 404 }
      )
    }

    if (answerOptionId) {
      const option =
        await prisma.answer_options.findFirst({
          where: {
            id: answerOptionId,
            question_id: questionId,
          },
        })

      if (!option) {
        return NextResponse.json(
          {
            error:
              "Answer option does not belong to this question.",
          },
          { status: 400 }
        )
      }
    }

    const score = answerOptionId
      ? (
          await prisma.answer_options.findUnique({
            where: {
              id: answerOptionId,
            },
          })
        )?.score_weight ?? 0
      : 0

    const answer =
      await prisma.assessment_answers.create({
        data: {
          attempt_id: attemptId,
          question_id: questionId,
          answer_option_id: answerOptionId,
          score,
          number_value:
            numberValue !== null
              ? numberValue
              : null,
        },
      })

    return NextResponse.json({
      success: true,
      answerId: answer.id,
    })
  } catch (error) {
    console.error(
      "ASSESSMENT ANSWER ERROR:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to save answer.",
      },
      { status: 500 }
    )
  }
}