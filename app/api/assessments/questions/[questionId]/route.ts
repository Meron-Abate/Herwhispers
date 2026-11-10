import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

/**
 * UPDATE QUESTION
 */
export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      questionId: string
    }>
  }
) {
  try {
    const { questionId } = await context.params

    if (!isValidUUID(questionId)) {
      return NextResponse.json(
        {
          error: "Invalid question ID.",
        },
        {
          status: 400,
        }
      )
    }

    const body = await request.json()

    const prompt = String(body.prompt ?? "").trim()
    const type = String(body.type ?? "").trim()
    const isRequired = Boolean(body.isRequired)

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Question prompt is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !["SINGLE_CHOICE", "MULTIPLE_CHOICE", "NUMBER"].includes(type)
    ) {
      return NextResponse.json(
        {
          error: "Invalid question type.",
        },
        {
          status: 400,
        }
      )
    }

    const question = await prisma.questions.findUnique({
      where: {
        id: questionId,
      },
    })

    if (!question) {
      return NextResponse.json(
        {
          error: "Question not found.",
        },
        {
          status: 404,
        }
      )
    }

    const updatedQuestion = await prisma.questions.update({
      where: {
        id: questionId,
      },
      data: {
        prompt,
        type: type as
          | "SINGLE_CHOICE"
          | "MULTIPLE_CHOICE"
          | "NUMBER",
        is_required: isRequired,
      },
    })

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
    })
  } catch (error) {
    console.error("QUESTION UPDATE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to update question.",
      },
      {
        status: 500,
      }
    )
  }
}

/**
 * DELETE QUESTION
 */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      questionId: string
    }>
  }
) {
  try {
    const { questionId } = await context.params

    if (!isValidUUID(questionId)) {
      return NextResponse.json(
        {
          error: "Invalid question ID.",
        },
        {
          status: 400,
        }
      )
    }

    const question = await prisma.questions.findUnique({
      where: {
        id: questionId,
      },
    })

    if (!question) {
      return NextResponse.json(
        {
          error: "Question not found.",
        },
        {
          status: 404,
        }
      )
    }

    // Students' recorded answers point at this question, so removing
    // it would break their results.
    const answers = await prisma.assessment_answers.count({
      where: {
        question_id: questionId,
      },
    })

    if (answers > 0) {
      return NextResponse.json(
        {
          error: `Students have already answered this question (${answers} answer${
            answers === 1 ? "" : "s"
          }), so it can't be deleted. Edit it instead.`,
        },
        {
          status: 409,
        }
      )
    }

    // Close the gap in the numbering so questions stay 1..n. Moving
    // them in ascending order never collides with the unique
    // (assessment_id, order_index) constraint.
    const later = await prisma.questions.findMany({
      where: {
        assessment_id: question.assessment_id,
        order_index: {
          gt: question.order_index,
        },
      },
      orderBy: {
        order_index: "asc",
      },
    })

    await prisma.$transaction([
      prisma.questions.delete({
        where: {
          id: questionId,
        },
      }),
      ...later.map((item) =>
        prisma.questions.update({
          where: {
            id: item.id,
          },
          data: {
            order_index: item.order_index - 1,
          },
        })
      ),
    ])

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("QUESTION DELETE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to delete question.",
      },
      {
        status: 500,
      }
    )
  }
}