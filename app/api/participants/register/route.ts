import { randomUUID } from "crypto"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { getActiveCampaign } from "@/lib/campaigns"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function generateParticipantCode() {
  const year = new Date().getFullYear()

  return `HW-${year}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json()

    const studentId =
      String(body.studentId ?? "").trim()

    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "studentId is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!UUID_PATTERN.test(studentId)) {
      return NextResponse.json(
        {
          error:
            "studentId must be a valid student ID.",
        },
        {
          status: 400,
        }
      )
    }

    // Automatically find the active campaign.
    const campaign =
      await getActiveCampaign()

    if (!campaign) {
      return NextResponse.json(
        {
          error:
            "There is currently no active campaign.",
        },
        {
          status: 400,
        }
      )
    }

    // Check whether the student is already
    // registered for this campaign.
    const existingParticipant =
      await prisma.participants.findFirst({
        where: {
          student_id: studentId,
          campaign_id: campaign.id,
        },
      })

    if (existingParticipant) {
      return NextResponse.json({
        success: true,
        participant:
          existingParticipant,
        campaign: {
          id: campaign.id,
          name: campaign.name,
        },
        message:
          "Student is already registered for this campaign.",
      })
    }

    const existingAttempt =
      await prisma.assessment_attempts.findUnique({
        where: {
          student_id_campaign_id: {
            student_id: studentId,
            campaign_id: campaign.id,
          },
        },
      })

    const attempt =
      existingAttempt ??
      (await prisma.assessment_attempts.create({
        data: {
          assessment_id: campaign.assessment_id,
          campaign_id: campaign.id,
          student_id: studentId,
        },
      }))

    const participant =
      await prisma.participants.create({
        data: {
          participant_code:
            generateParticipantCode(),

          student_id: studentId,

          campaign_id: campaign.id,

          assessment_attempt_id: attempt.id,

          status: "WAITING_LIST",

          registered_at: new Date(),
        },
      })

    return NextResponse.json({
      success: true,

      participant,

      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
    })
  } catch (error) {
    console.error(
      "Participant registration error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to register participant.",
      },
      {
        status: 500,
      }
    )
  }
}
