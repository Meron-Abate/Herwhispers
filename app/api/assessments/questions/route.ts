import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const validQuestionTypes = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "NUMBER",
] as const

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

    const prompt = String(
      formData.get("prompt") ?? ""
    ).trim()

    const type = String(
      formData.get("type") ?? ""
    ).trim()

    const orderIndexValue = String(
      formData.get("order_index") ?? ""
    ).trim()

    const isRequired =
      formData.get("is_required") === "on"

    if (!assessmentId || !isValidUUID(assessmentId)) {
      return NextResponse.json(
        {
          error: "Invalid assessment ID.",
        },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Question text is required.",
        },
        { status: 400 }
      )
    }

    if (
      !validQuestionTypes.includes(
        type as (typeof validQuestionTypes)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid question type.",
        },
        { status: 400 }
      )
    }

    const assessment =
      await prisma.assessments.findUnique({
        where: {
          id: assessmentId,
        },
      })

    if (!assessment) {
      return NextResponse.json(
        {
          error: "Assessment not found.",
        },
        { status: 404 }
      )
    }

    /*
     * Find the next available question order.
     *
     * This protects us from the unique constraint:
     *
     * @@unique([assessment_id, order_index])
     */

    const lastQuestion =
      await prisma.questions.findFirst({
        where: {
          assessment_id: assessmentId,
        },
        orderBy: {
          order_index: "desc",
        },
      })

    const nextOrderIndex =
      (lastQuestion?.order_index ?? 0) + 1

    let requestedOrderIndex =
      Number(orderIndexValue)

    if (
      !Number.isInteger(requestedOrderIndex) ||
      requestedOrderIndex < 1
    ) {
      requestedOrderIndex = nextOrderIndex
    }

    /*
     * If the requested order already exists,
     * automatically use the next available position.
     */

    const existingQuestion =
      await prisma.questions.findFirst({
        where: {
          assessment_id: assessmentId,
          order_index: requestedOrderIndex,
        },
      })

    const finalOrderIndex = existingQuestion
      ? nextOrderIndex
      : requestedOrderIndex

    await prisma.questions.create({
      data: {
        assessment_id: assessmentId,
        prompt,
        type: type as
          | "SINGLE_CHOICE"
          | "MULTIPLE_CHOICE"
          | "NUMBER",
        order_index: finalOrderIndex,
        is_required: isRequired,
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
      "QUESTION CREATION ERROR:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to create question.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}