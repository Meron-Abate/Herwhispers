import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveCampaign } from "@/lib/campaigns"

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

    const participantCode =
      `HW-${new Date().getFullYear()}-${Date.now()}`

    const participant =
      await prisma.participants.create({
        data: {
          participant_code:
            participantCode,

          student_id: studentId,

          campaign_id: campaign.id,

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