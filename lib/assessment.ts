import { prisma } from "@/lib/prisma"

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