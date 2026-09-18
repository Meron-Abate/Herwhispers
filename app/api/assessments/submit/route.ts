import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { evaluateAssessment } from "@/lib/assessment"
import { createParticipantFromAssessment } from "@/lib/participants"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const attemptId = String(
      formData.get("attempt_id") ?? ""
    ).trim()

    if (!attemptId) {
      return NextResponse.json(
        {
          error:
            "Assessment attempt ID is required.",
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
          error:
            "Assessment attempt not found.",
        },
        { status: 404 }
      )
    }

    const result =
      await evaluateAssessment(attemptId)

    let participant = null

    if (result.result === "ELIGIBLE") {
      participant =
        await createParticipantFromAssessment(
          attemptId
        )
    }

    return NextResponse.json({
      success: true,
      attemptId: result.id,
      totalScore: result.total_score,
      result: result.result,
      reason: result.result_reason,
      participantId: participant?.id ?? null,
      participantCode:
        participant?.participant_code ?? null,
    })
  } catch (error) {
    console.error(
      "ASSESSMENT SUBMISSION ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to submit assessment.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}