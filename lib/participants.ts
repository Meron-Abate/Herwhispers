import { prisma } from "@/lib/prisma"

function randomCode() {
  return Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()
}

export async function createParticipantFromAssessment(
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
      },
    })

  if (!attempt) {
    throw new Error(
      "Assessment attempt not found."
    )
  }

  if (!attempt.result) {
    throw new Error(
      "Assessment has not been evaluated."
    )
  }

  if (attempt.result !== "ELIGIBLE") {
    return null
  }

  const existingParticipant =
    await prisma.participants.findUnique({
      where: {
        assessment_attempt_id: attemptId,
      },
    })

  if (existingParticipant) {
    return existingParticipant
  }

  let participantCode = ""

  let attempts = 0

  while (!participantCode && attempts < 10) {
    const candidate =
      `HW-${new Date().getFullYear()}-${randomCode()}`

    const existing =
      await prisma.participants.findUnique({
        where: {
          participant_code: candidate,
        },
      })

    if (!existing) {
      participantCode = candidate
    }

    attempts++
  }

  if (!participantCode) {
    throw new Error(
      "Could not generate a unique participant code."
    )
  }

  const participant =
    await prisma.participants.create({
      data: {
        participant_code: participantCode,
        student_id: attempt.student_id,
        campaign_id: attempt.campaign_id,
        assessment_attempt_id: attempt.id,
        status: "VERIFIED",
      },
    })

  return participant
}