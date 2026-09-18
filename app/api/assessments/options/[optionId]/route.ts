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

    await prisma.answer_options.delete({
      where: {
        id: optionId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("ANSWER OPTION DELETE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to delete answer option.",
      },
      { status: 500 }
    )
  }
}