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
      ruleId: string
    }>
  }
) {
  try {
    const { ruleId } = await context.params

    if (!isValidUUID(ruleId)) {
      return NextResponse.json(
        { error: "Invalid rule ID." },
        { status: 400 }
      )
    }

    await prisma.eligibility_rules.delete({
      where: {
        id: ruleId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("RULE DELETE ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to delete eligibility rule.",
      },
      { status: 500 }
    )
  }
}