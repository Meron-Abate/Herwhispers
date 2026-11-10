import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      optionId: string
    }>
  }
) {
  try {
    const { optionId } = await context.params

    if (!isValidUUID(optionId)) {
      return NextResponse.json(
        { error: "Invalid option ID." },
        { status: 400 }
      )
    }

    const body = await request.json()

    const label = String(body.label ?? "").trim()
    const scoreWeight = Number(body.scoreWeight)
    const isDisqualifier = Boolean(body.isDisqualifier)

    if (!label) {
      return NextResponse.json(
        { error: "Answer label is required." },
        { status: 400 }
      )
    }

    if (!Number.isInteger(scoreWeight)) {
      return NextResponse.json(
        { error: "Score must be a whole number." },
        { status: 400 }
      )
    }

    const option = await prisma.answer_options.update({
      where: {
        id: optionId,
      },
      data: {
        label,
        score_weight: scoreWeight,
        is_disqualifier: isDisqualifier,
      },
    })

    return NextResponse.json({
      success: true,
      option,
    })
  } catch (error) {
    console.error("ANSWER OPTION UPDATE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to update answer option.",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      optionId: string
    }>
  }
) {
  try {
    const { optionId } = await context.params

    if (!isValidUUID(optionId)) {
      return NextResponse.json(
        { error: "Invalid option ID." },
        { status: 400 }
      )
    }

    // Students' past answers point at this option, so removing it
    // would break their results.
    const answers = await prisma.assessment_answers.count({
      where: {
        answer_option_id: optionId,
      },
    })

    if (answers > 0) {
      return NextResponse.json(
        {
          error: `${answers} student answer${
            answers === 1 ? " uses" : "s use"
          } this option, so it can't be deleted. Edit it instead.`,
        },
        { status: 409 }
      )
    }

    await prisma.answer_options.delete({
      where: {
        id: optionId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Answer option not found." },
        { status: 404 }
      )
    }

    console.error("ANSWER OPTION DELETE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to delete answer option.",
      },
      { status: 500 }
    )
  }
}
