import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getActiveCampaign } from "@/lib/campaigns"

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json()

    const studentId =
      String(
        body.studentId ?? ""
      ).trim()

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


    /*
     * Make sure the student exists.
     */

    const student =
      await prisma.students.findUnique({
        where: {
          id: studentId,
        },
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student not found.",
        },
        {
          status: 404,
        }
      )
    }


    /*
     * Find the current active campaign.
     */

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


    /*
     * Check whether this student already
     * has an assessment attempt for
     * this campaign.
     */

    const existingAttempt =
      await prisma.assessment_attempts.findUnique({
        where: {
          student_id_campaign_id: {
            student_id: studentId,
            campaign_id: campaign.id,
          },
        },
      })


    if (existingAttempt) {
      return NextResponse.json({
        success: true,

        alreadyStarted: true,

        attempt: existingAttempt,

        campaign: {
          id: campaign.id,
          name: campaign.name,
        },

        message:
          "Student already has an assessment attempt for this campaign.",
      })
    }


    /*
     * Create the assessment attempt.
     */

    const attempt =
      await prisma.assessment_attempts.create({
        data: {
          assessment_id:
            campaign.assessment_id,

          campaign_id:
            campaign.id,

          student_id:
            studentId,

          total_score: 0,

          result: null,
        },
      })


    return NextResponse.json({
      success: true,

      alreadyStarted: false,

      attempt,

      campaign: {
        id: campaign.id,
        name: campaign.name,
      },

      message:
        "Assessment started successfully.",
    })

  } catch (error) {
    console.error(
      "Assessment registration error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to start assessment.",
      },
      {
        status: 500,
      }
    )
  }
}