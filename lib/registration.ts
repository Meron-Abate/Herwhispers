import { randomUUID } from "crypto"

import { prisma } from "@/lib/prisma"
import { evaluateAssessment } from "@/lib/assessment"

function generateParticipantCode() {
  const year = new Date().getFullYear()

  return `HW-${year}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`
}

export async function completeRegistration(
  attemptId: string
) {
  const attempt =
    await prisma.assessment_attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        students: true,
        campaigns: true,
        participants: {
          include: {
            qr_codes: true,
          },
        },
      },
    })

  if (!attempt) {
    throw new Error(
      "Assessment attempt not found."
    )
  }

  if (attempt.participants) {
    return {
      result: "ALREADY_REGISTERED" as const,
      participant:
        attempt.participants,
      qrCode:
        attempt.participants.qr_codes,
    }
  }

  const evaluation =
    await evaluateAssessment(attemptId)

  if (
    evaluation.result !==
    "ELIGIBLE"
  ) {
    return {
      result: evaluation.result,
      reason:
        evaluation.result_reason,
    }
  }

  const participantCode =
    generateParticipantCode()

  const participant =
    await prisma.participants.create({
      data: {
        participant_code:
          participantCode,
        student_id:
          attempt.student_id,
        campaign_id:
          attempt.campaign_id,
        assessment_attempt_id:
          attempt.id,
        status: "VERIFIED",
      },
    })

  const qrToken = randomUUID()

  const qrCode =
    await prisma.qr_codes.create({
      data: {
        participant_id:
          participant.id,
        qr_token: qrToken,
      },
    })

  return {
    result: "ELIGIBLE" as const,
    participant,
    qrCode,
    reason:
      evaluation.result_reason,
  }
}