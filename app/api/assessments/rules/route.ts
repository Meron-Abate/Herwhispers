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

    const name = String(
      formData.get("name") ?? ""
    ).trim()

    const minimumValue = String(
      formData.get("minimum_score") ?? ""
    ).trim()

    const maximumValue = String(
      formData.get("maximum_score") ?? ""
    ).trim()

    const result = String(
      formData.get("result") ?? ""
    ).trim()

    const reason = String(
      formData.get("reason") ?? ""
    ).trim()

    const priorityValue = String(
      formData.get("priority") ?? "1"
    ).trim()

    if (!isValidUUID(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessment ID." },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: "Rule name is required." },
        { status: 400 }
      )
    }

    if (
      ![
        "ELIGIBLE",
        "NOT_ELIGIBLE",
        "NEEDS_REVIEW",
      ].includes(result)
    ) {
      return NextResponse.json(
        { error: "Invalid result." },
        { status: 400 }
      )
    }

    const minimumScore =
      minimumValue === ""
        ? null
        : Number(minimumValue)

    const maximumScore =
      maximumValue === ""
        ? null
        : Number(maximumValue)

    const priority = Number(priorityValue)

    if (
      minimumScore !== null &&
      !Number.isInteger(minimumScore)
    ) {
      return NextResponse.json(
        { error: "Invalid minimum score." },
        { status: 400 }
      )
    }

    if (
      maximumScore !== null &&
      !Number.isInteger(maximumScore)
    ) {
      return NextResponse.json(
        { error: "Invalid maximum score." },
        { status: 400 }
      )
    }

    if (!Number.isInteger(priority) || priority < 1) {
      return NextResponse.json(
        { error: "Priority must be at least 1." },
        { status: 400 }
      )
    }

    if (
      minimumScore !== null &&
      maximumScore !== null &&
      minimumScore > maximumScore
    ) {
      return NextResponse.json(
        {
          error:
            "Minimum score cannot be greater than maximum score.",
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
        { error: "Assessment not found." },
        { status: 404 }
      )
    }

    await prisma.eligibility_rules.create({
      data: {
        assessment_id: assessmentId,
        name,
        minimum_score: minimumScore,
        maximum_score: maximumScore,
        result: result as
          | "ELIGIBLE"
          | "NOT_ELIGIBLE"
          | "NEEDS_REVIEW",
        reason: reason || null,
        priority,
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
      "ELIGIBILITY RULE CREATION ERROR:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to create eligibility rule.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}