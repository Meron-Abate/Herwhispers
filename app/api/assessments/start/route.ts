import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const studentId = String(
      body.studentId ?? ""
    ).trim()

    const campaignId = String(
      body.campaignId ?? ""
    ).trim()

    if (!studentId || !campaignId) {
      return NextResponse.json(
        {
          error:
            "studentId and campaignId are required.",
        },
        { status: 400 }
      )
    }

    const campaign =
      await prisma.campaigns.findUnique({
        where: {
          id: campaignId,
        },
      })

    if (!campaign) {
      return NextResponse.json(
        {
          error: "Campaign not found.",
        },
        { status: 404 }
      )
    }

    if (campaign.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "This campaign is not currently active.",
        },
        { status: 400 }
      )
    }

    const existing =
      await prisma.assessment_attempts.findUnique({
        where: {
          student_id_campaign_id: {
            student_id: studentId,
            campaign_id: campaignId,
          },
        },
      })

    if (existing) {
      return NextResponse.json({
        success: true,
        attemptId: existing.id,
        existing: true,
      })
    }

    const attempt =
      await prisma.assessment_attempts.create({
        data: {
          assessment_id: campaign.assessment_id,
          campaign_id: campaign.id,
          student_id: studentId,
        },
      })

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      existing: false,
    })
  } catch (error) {
    console.error(
      "ASSESSMENT START ERROR:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to start assessment.",
      },
      { status: 500 }
    )
  }
}