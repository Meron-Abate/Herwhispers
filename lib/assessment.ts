
import { prisma } from "@/lib/prisma"

export async function getAssessmentAttempt(
  studentId: string,
  campaignId: string
) {
  return prisma.assessment_attempts.findUnique({
    where: {
      student_id_campaign_id: {
        student_id: studentId,
        campaign_id: campaignId,
      },
    },
    include: {
      assessment_answers: true,
    },
  })
}

export async function createAssessmentAttempt(
  studentId: string,
  campaignId: string,
  assessmentId: string
) {
  return prisma.assessment_attempts.create({
    data: {
      student_id: studentId,
      campaign_id: campaignId,
      assessment_id: assessmentId,
    },
    include: {
      assessment_answers: true,
    },
  })
}

export async function resetAssessmentAttempt(
  attemptId: string
) {
  await prisma.assessment_answers.deleteMany({
    where: {
      attempt_id: attemptId,
    },
  })

  return prisma.assessment_attempts.update({
    where: {
      id: attemptId,
    },
    data: {
      total_score: 0,
      result: null,
      result_reason: null,
      submitted_at: null,
      started_at: new Date(),
    },
    include: {
      assessment_answers: true,
    },
  })
}

export async function saveSingleChoiceAnswer(
  attemptId: string,
  questionId: string,
  optionId: string
) {
  const option = await prisma.answer_options.findUnique({
    where: {
      id: optionId,
    },
  })

  if (!option) {
    throw new Error("Answer option not found.")
  }

  const existingAnswer =
    await prisma.assessment_answers.findFirst({
      where: {
        attempt_id: attemptId,
        question_id: questionId,
      },
    })

  if (existingAnswer) {
    return {
      answer: existingAnswer,
      alreadyAnswered: true,
    }
  }

  const answer =
    await prisma.assessment_answers.create({
      data: {
        attempt_id: attemptId,
        question_id: questionId,
        answer_option_id: optionId,
        score: option.score_weight,
      },
    })

  return {
    answer,
    alreadyAnswered: false,
  }
}

export async function toggleMultipleChoiceAnswer(
  attemptId: string,
  questionId: string,
  optionId: string
) {
  const option = await prisma.answer_options.findUnique({
    where: {
      id: optionId,
    },
  })

  if (!option) {
    throw new Error("Answer option not found.")
  }

  const existingAnswer =
    await prisma.assessment_answers.findFirst({
      where: {
        attempt_id: attemptId,
        question_id: questionId,
        answer_option_id: optionId,
      },
    })

  if (existingAnswer) {
    await prisma.assessment_answers.delete({
      where: {
        id: existingAnswer.id,
      },
    })

    return {
      selected: false,
    }
  }

  await prisma.assessment_answers.create({
    data: {
      attempt_id: attemptId,
      question_id: questionId,
      answer_option_id: optionId,
      score: option.score_weight,
    },
  })

  return {
    selected: true,
  }
}

export async function evaluateAssessment(
  attemptId: string
) {
  const attempt =
    await prisma.assessment_attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        assessments: {
          include: {
            eligibility_rules: {
              orderBy: {
                priority: "asc",
              },
            },
          },
        },
        assessment_answers: true,
      },
    })

  if (!attempt) {
    throw new Error(
      "Assessment attempt not found."
    )
  }

  if (attempt.assessment_answers.length === 0) {
    throw new Error(
      "No answers were submitted."
    )
  }

  let totalScore = 0

  const answerOptionIds =
    attempt.assessment_answers
      .map(
        (answer) =>
          answer.answer_option_id
      )
      .filter(
        (id): id is string =>
          Boolean(id)
      )

  const answerOptions =
    answerOptionIds.length > 0
      ? await prisma.answer_options.findMany({
          where: {
            id: {
              in: answerOptionIds,
            },
          },
        })
      : []

  const optionMap = new Map(
    answerOptions.map((option) => [
      option.id,
      option,
    ])
  )

  let hasDisqualifier = false

  for (const answer of attempt.assessment_answers) {
    totalScore += answer.score

    if (answer.answer_option_id) {
      const option = optionMap.get(
        answer.answer_option_id
      )

      if (option?.is_disqualifier) {
        hasDisqualifier = true
      }
    }
  }

  let result:
    | "ELIGIBLE"
    | "NOT_ELIGIBLE"
    | "NEEDS_REVIEW"

  let resultReason: string | null = null

  if (hasDisqualifier) {
    result = "NOT_ELIGIBLE"

    resultReason =
      "The submitted assessment contains a disqualifying answer."
  } else {
    const matchingRule =
      attempt.assessments.eligibility_rules.find(
        (rule) => {
          const minimumMatches =
            rule.minimum_score === null ||
            totalScore >= rule.minimum_score

          const maximumMatches =
            rule.maximum_score === null ||
            totalScore <= rule.maximum_score

          return (
            minimumMatches &&
            maximumMatches
          )
        }
      )

    if (matchingRule) {
      result = matchingRule.result
      resultReason = matchingRule.reason
    } else {
      result = "NEEDS_REVIEW"

      resultReason =
        "No eligibility rule matched the assessment score."
    }
  }

  return prisma.assessment_attempts.update({
    where: {
      id: attemptId,
    },
    data: {
      total_score: totalScore,
      result,
      result_reason: resultReason,
      submitted_at: new Date(),
    },
  })
}

