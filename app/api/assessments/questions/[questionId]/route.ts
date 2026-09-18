import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

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
        { error: "Invalid question ID." },
        { status: 400 }
      )
    }

    await prisma.questions.delete({
      where: {
        id: questionId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("QUESTION DELETE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to delete question.",
      },
      { status: 500 }
    )
  }
}