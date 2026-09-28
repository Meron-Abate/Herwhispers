import { Bot, InlineKeyboard } from "grammy"

import { prisma } from "@/lib/prisma"

import {
  getActiveCampaign,
} from "@/lib/campaigns"

import {
  getOrCreateStudent,
} from "@/lib/students"

import {
  getAssessmentAttempt,
  createAssessmentAttempt,
  resetAssessmentAttempt,
  saveSingleChoiceAnswer,
  toggleMultipleChoiceAnswer,
} from "@/lib/assessment"

import {
  completeRegistration,
} from "@/lib/registration"

import {
  mainMenuKeyboard,
} from "@/telegram/keyboards/mainMenu"

export const bot = new Bot(
  process.env.TELEGRAM_BOT_TOKEN!
)

/*
|--------------------------------------------------------------------------
| Send Question
|--------------------------------------------------------------------------
|
| This function checks the question type.
|
| SINGLE_CHOICE:
|   Student selects one answer.
|
| MULTIPLE_CHOICE:
|   Student can select multiple answers and then
|   press Continue.
|
| NUMBER:
|   Number input will be handled separately.
|
*/

async function sendQuestion(
  ctx: any,
  campaign: any,
  questionIndex: number,
  attempt: any
) {
  const questions =
    campaign.assessments.questions

  const question =
    questions[questionIndex]

  if (!question) {
    return
  }

  /*
  |--------------------------------------------------------------------------
  | SINGLE CHOICE
  |--------------------------------------------------------------------------
  */

  if (
    question.type ===
    "SINGLE_CHOICE"
  ) {
    const keyboard =
      new InlineKeyboard()

    for (
      const option of question.answer_options
    ) {
      keyboard
        .text(
          option.label,
          `answer:${option.id}`
        )
        .row()
    }

    await ctx.reply(
      `${questionIndex + 1}. ${question.prompt}`,
      {
        reply_markup:
          keyboard,
      }
    )

    return
  }

  /*
  |--------------------------------------------------------------------------
  | MULTIPLE CHOICE
  |--------------------------------------------------------------------------
  */

  if (
    question.type ===
    "MULTIPLE_CHOICE"
  ) {
    const selectedAnswers =
      attempt.assessment_answers.filter(
        (answer: any) =>
          answer.question_id ===
          question.id
      )

    const selectedOptionIds =
      new Set(
        selectedAnswers
          .map(
            (answer: any) =>
              answer.answer_option_id
          )
          .filter(Boolean)
      )

    const keyboard =
      new InlineKeyboard()

    for (
      const option of question.answer_options
    ) {
      const selected =
        selectedOptionIds.has(
          option.id
        )

      keyboard
        .text(
          selected
            ? `Selected: ${option.label}`
            : option.label,
          `multi:${option.id}`
        )
        .row()
    }

    keyboard.text(
      "Continue",
      `multi_continue:${question.id}`
    )

    await ctx.reply(
      `${questionIndex + 1}. ${question.prompt}\n\nSelect all that apply, then press Continue.`,
      {
        reply_markup:
          keyboard,
      }
    )

    return
  }

  /*
  |--------------------------------------------------------------------------
  | NUMBER
  |--------------------------------------------------------------------------
  */

  if (
    question.type ===
    "NUMBER"
  ) {
    await ctx.reply(
      `${questionIndex + 1}. ${question.prompt}\n\nPlease enter a number.`
    )

    return
  }

  /*
  |--------------------------------------------------------------------------
  | UNKNOWN QUESTION TYPE
  |--------------------------------------------------------------------------
  */

  await ctx.reply(
    `${questionIndex + 1}. ${question.prompt}`
  )
}

/*
|--------------------------------------------------------------------------
| Send First Question
|--------------------------------------------------------------------------
*/

async function sendFirstQuestion(
  ctx: any,
  campaign: any,
  attempt: any
) {
  await sendQuestion(
    ctx,
    campaign,
    0,
    attempt
  )
}

/*
|--------------------------------------------------------------------------
| /start
|--------------------------------------------------------------------------
*/

bot.command(
  "start",
  async (ctx) => {
    await ctx.reply(
      "Welcome to HerWhispers.",
      {
        reply_markup:
          mainMenuKeyboard(),
      }
    )
  }
)

/*
|--------------------------------------------------------------------------
| Doctor / Health Question
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  "doctor_question",
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    await ctx.reply(
      "The Doctor / Health Question feature will be available soon."
    )
  }
)

/*
|--------------------------------------------------------------------------
| Anonymous Story
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  "anonymous_story",
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    await ctx.reply(
      "The Anonymous Story feature will be available soon."
    )
  }
)

/*
|--------------------------------------------------------------------------
| Get Pad Support
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  "get_pad_support",
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | Find or create student
      |--------------------------------------------------------------------------
      */

      const telegramId =
        BigInt(ctx.from.id)

      const student =
        await getOrCreateStudent({
          telegramId,
        })

      /*
      |--------------------------------------------------------------------------
      | Get active campaign
      |--------------------------------------------------------------------------
      */

      const campaign =
        await getActiveCampaign()

      if (!campaign) {
        await ctx.reply(
          "There is currently no active campaign."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Check if registration is already completed
      |--------------------------------------------------------------------------
      */

      const completedParticipant =
        await prisma.participants.findFirst({
          where: {
            student_id:
              student.id,
            campaign_id:
              campaign.id,
          },
          include: {
            qr_codes: true,
          },
        })

      if (
        completedParticipant &&
        completedParticipant.qr_codes
      ) {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Check for existing unfinished attempt
      |--------------------------------------------------------------------------
      */

      const existingAttempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (
        existingAttempt &&
        existingAttempt.assessment_answers
          .length > 0
      ) {
        const keyboard =
          new InlineKeyboard()
            .text(
              "Start Again",
              "restart_assessment"
            )

        await ctx.reply(
          "You have an unfinished registration for this campaign.\n\nIf you start again, your previous answers will be cleared.",
          {
            reply_markup:
              keyboard,
          }
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Create assessment attempt
      |--------------------------------------------------------------------------
      */

      let attempt =
        existingAttempt

      if (!attempt) {
        attempt =
          await createAssessmentAttempt(
            student.id,
            campaign.id,
            campaign.assessments.id
          )
      }

      /*
      |--------------------------------------------------------------------------
      | Start assessment
      |--------------------------------------------------------------------------
      */

      await sendFirstQuestion(
        ctx,
        campaign,
        attempt
      )
    } catch (error) {
      console.error(
        "GET PAD SUPPORT ERROR:",
        error
      )

      await ctx.reply(
        "Something went wrong while starting your registration. Please try again."
      )
    }
  }
)

/*
|--------------------------------------------------------------------------
| Restart Assessment
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  "restart_assessment",
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    try {
      const telegramId =
        BigInt(ctx.from.id)

      const student =
        await getOrCreateStudent({
          telegramId,
        })

      const campaign =
        await getActiveCampaign()

      if (!campaign) {
        await ctx.reply(
          "There is currently no active campaign."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Make sure the student hasn't already completed registration
      |--------------------------------------------------------------------------
      */

      const completedParticipant =
        await prisma.participants.findFirst({
          where: {
            student_id:
              student.id,
            campaign_id:
              campaign.id,
          },
          include: {
            qr_codes: true,
          },
        })

      if (
        completedParticipant &&
        completedParticipant.qr_codes
      ) {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Find existing attempt
      |--------------------------------------------------------------------------
      */

      const attempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      /*
      |--------------------------------------------------------------------------
      | If no attempt exists, create one
      |--------------------------------------------------------------------------
      */

      if (!attempt) {
        const newAttempt =
          await createAssessmentAttempt(
            student.id,
            campaign.id,
            campaign.assessments.id
          )

        await sendFirstQuestion(
          ctx,
          campaign,
          newAttempt
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Reset existing attempt
      |--------------------------------------------------------------------------
      */

      const resetAttempt =
        await resetAssessmentAttempt(
          attempt.id
        )

      await sendFirstQuestion(
        ctx,
        campaign,
        resetAttempt
      )
    } catch (error) {
      console.error(
        "RESTART ASSESSMENT ERROR:",
        error
      )

      await ctx.reply(
        "Something went wrong while restarting your registration. Please try again."
      )
    }
  }
)

/*
|--------------------------------------------------------------------------
| Multiple Choice Answer
|--------------------------------------------------------------------------
|
| This handler is ONLY used for questions whose
| database type is MULTIPLE_CHOICE.
|
*/

bot.callbackQuery(
  /^multi:([^:]+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    try {
      const optionId =
        ctx.match[1]

      console.log(
        "MULTIPLE CHOICE CALLBACK"
      )

      console.log(
        "Option ID:",
        optionId
      )

      /*
      |--------------------------------------------------------------------------
      | Student
      |--------------------------------------------------------------------------
      */

      const telegramId =
        BigInt(ctx.from.id)

      const student =
        await getOrCreateStudent({
          telegramId,
        })

      /*
      |--------------------------------------------------------------------------
      | Campaign
      |--------------------------------------------------------------------------
      */

      const campaign =
        await getActiveCampaign()

      if (!campaign) {
        await ctx.reply(
          "There is currently no active campaign."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Completed registration check
      |--------------------------------------------------------------------------
      */

      const participant =
        await prisma.participants.findFirst({
          where: {
            student_id:
              student.id,
            campaign_id:
              campaign.id,
          },
          include: {
            qr_codes: true,
          },
        })

      if (
        participant &&
        participant.qr_codes
      ) {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Assessment attempt
      |--------------------------------------------------------------------------
      */

      const attempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!attempt) {
        await ctx.reply(
          "Your registration could not be found. Please start again."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Find question that owns this option
      |--------------------------------------------------------------------------
      */

      const question =
        campaign.assessments.questions.find(
          (q: any) =>
            q.answer_options.some(
              (option: any) =>
                option.id ===
                optionId
            )
        )

      if (!question) {
        await ctx.reply(
          "This answer is no longer available. Please start the registration again."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Make sure this really is a multiple-choice question
      |--------------------------------------------------------------------------
      */

      if (
        question.type !==
        "MULTIPLE_CHOICE"
      ) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Select / unselect answer
      |--------------------------------------------------------------------------
      */

      await toggleMultipleChoiceAnswer(
        attempt.id,
        question.id,
        optionId
      )

      /*
      |--------------------------------------------------------------------------
      | Reload attempt
      |--------------------------------------------------------------------------
      */

      const updatedAttempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!updatedAttempt) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Determine selected options
      |--------------------------------------------------------------------------
      */

      const selectedAnswers =
        updatedAttempt.assessment_answers.filter(
          (answer) =>
            answer.question_id ===
            question.id
        )

      const selectedOptionIds =
        new Set(
          selectedAnswers
            .map(
              (answer) =>
                answer.answer_option_id
            )
            .filter(Boolean)
        )

      /*
      |--------------------------------------------------------------------------
      | Rebuild keyboard
      |--------------------------------------------------------------------------
      */

      const keyboard =
        new InlineKeyboard()

      for (
        const option of question.answer_options
      ) {
        const selected =
          selectedOptionIds.has(
            option.id
          )

        keyboard
          .text(
            selected
              ? `Selected: ${option.label}`
              : option.label,
            `multi:${option.id}`
          )
          .row()
      }

      keyboard.text(
        "Continue",
        `multi_continue:${question.id}`
      )

      /*
      |--------------------------------------------------------------------------
      | Update Telegram message
      |--------------------------------------------------------------------------
      */

      try {
        await ctx.editMessageReplyMarkup({
          reply_markup:
            keyboard,
        })
      } catch (error) {
        console.error(
          "Could not update multiple-choice buttons:",
          error
        )
      }
    } catch (error) {
      console.error(
        "MULTIPLE CHOICE ERROR:",
        error
      )
    }
  }
)

/*
|--------------------------------------------------------------------------
| Multiple Choice Continue
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  /^multi_continue:([^:]+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    try {
      const questionId =
        ctx.match[1]

      /*
      |--------------------------------------------------------------------------
      | Student
      |--------------------------------------------------------------------------
      */

      const telegramId =
        BigInt(ctx.from.id)

      const student =
        await getOrCreateStudent({
          telegramId,
        })

      /*
      |--------------------------------------------------------------------------
      | Campaign
      |--------------------------------------------------------------------------
      */

      const campaign =
        await getActiveCampaign()

      if (!campaign) {
        await ctx.reply(
          "There is currently no active campaign."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Completed registration check
      |--------------------------------------------------------------------------
      */

      const participant =
        await prisma.participants.findFirst({
          where: {
            student_id:
              student.id,
            campaign_id:
              campaign.id,
          },
          include: {
            qr_codes: true,
          },
        })

      if (
        participant &&
        participant.qr_codes
      ) {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Assessment attempt
      |--------------------------------------------------------------------------
      */

      const attempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!attempt) {
        await ctx.reply(
          "Your registration could not be found. Please start again."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Find question
      |--------------------------------------------------------------------------
      */

      const questionIndex =
        campaign.assessments.questions.findIndex(
          (question: any) =>
            question.id ===
            questionId
        )

      if (
        questionIndex === -1
      ) {
        await ctx.reply(
          "This question could not be found."
        )

        return
      }

      const question =
        campaign.assessments.questions[
          questionIndex
        ]

      /*
      |--------------------------------------------------------------------------
      | Verify question type
      |--------------------------------------------------------------------------
      */

      if (
        question.type !==
        "MULTIPLE_CHOICE"
      ) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Check selected answers
      |--------------------------------------------------------------------------
      */

      const selectedAnswers =
        attempt.assessment_answers.filter(
          (answer) =>
            answer.question_id ===
            questionId
        )

      if (
        selectedAnswers.length === 0
      ) {
        try {
          await ctx.answerCallbackQuery({
            text:
              "Please select at least one option.",
            show_alert: true,
          })
        } catch {
          // Ignore old Telegram callbacks.
        }

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Determine next question
      |--------------------------------------------------------------------------
      */

      const nextQuestionIndex =
        questionIndex + 1

      /*
      |--------------------------------------------------------------------------
      | Assessment finished
      |--------------------------------------------------------------------------
      */

      if (
        nextQuestionIndex >=
        campaign.assessments.questions.length
      ) {
        await finishRegistration(
          ctx,
          attempt.id
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Continue to next question
      |--------------------------------------------------------------------------
      */

      const updatedAttempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!updatedAttempt) {
        return
      }

      await sendQuestion(
        ctx,
        campaign,
        nextQuestionIndex,
        updatedAttempt
      )
    } catch (error) {
      console.error(
        "MULTIPLE CHOICE CONTINUE ERROR:",
        error
      )

      await ctx.reply(
        "Something went wrong while continuing the assessment. Please try again."
      )
    }
  }
)

/*
|--------------------------------------------------------------------------
| Single Choice Answer
|--------------------------------------------------------------------------
|
| This handler is ONLY used for SINGLE_CHOICE
| questions.
|
*/

bot.callbackQuery(
  /^answer:([^:]+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    try {
      const optionId =
        ctx.match[1]

      console.log(
        "ANSWER CALLBACK RECEIVED"
      )

      console.log(
        "Option ID:",
        optionId
      )

      /*
      |--------------------------------------------------------------------------
      | Student
      |--------------------------------------------------------------------------
      */

      const telegramId =
        BigInt(ctx.from.id)

      const student =
        await getOrCreateStudent({
          telegramId,
        })

      /*
      |--------------------------------------------------------------------------
      | Campaign
      |--------------------------------------------------------------------------
      */

      const campaign =
        await getActiveCampaign()

      if (!campaign) {
        await ctx.reply(
          "There is currently no active campaign."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Completed registration check
      |--------------------------------------------------------------------------
      */

      const participant =
        await prisma.participants.findFirst({
          where: {
            student_id:
              student.id,
            campaign_id:
              campaign.id,
          },
          include: {
            qr_codes: true,
          },
        })

      if (
        participant &&
        participant.qr_codes
      ) {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Assessment attempt
      |--------------------------------------------------------------------------
      */

      const attempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!attempt) {
        await ctx.reply(
          "Your registration could not be found. Please start again."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Find question
      |--------------------------------------------------------------------------
      */

      const question =
        campaign.assessments.questions.find(
          (q: any) =>
            q.answer_options.some(
              (option: any) =>
                option.id ===
                optionId
            )
        )

      if (!question) {
        await ctx.reply(
          "This answer is no longer available. Please start the registration again."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Make sure this is SINGLE_CHOICE
      |--------------------------------------------------------------------------
      */

      if (
        question.type !==
        "SINGLE_CHOICE"
      ) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Find answer option
      |--------------------------------------------------------------------------
      */

      const option =
        question.answer_options.find(
          (item: any) =>
            item.id ===
            optionId
        )

      if (!option) {
        await ctx.reply(
          "This answer could not be found."
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent duplicate answer
      |--------------------------------------------------------------------------
      */

      const existingAnswer =
        attempt.assessment_answers.find(
          (answer) =>
            answer.question_id ===
            question.id
        )

      if (existingAnswer) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Save answer
      |--------------------------------------------------------------------------
      */

      await saveSingleChoiceAnswer(
        attempt.id,
        question.id,
        optionId
      )

      /*
      |--------------------------------------------------------------------------
      | Find next question
      |--------------------------------------------------------------------------
      */

      const nextQuestionIndex =
        campaign.assessments.questions.findIndex(
          (item: any) =>
            item.id ===
            question.id
        ) + 1

      /*
      |--------------------------------------------------------------------------
      | Assessment finished
      |--------------------------------------------------------------------------
      */

      if (
        nextQuestionIndex >=
        campaign.assessments.questions.length
      ) {
        await finishRegistration(
          ctx,
          attempt.id
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Continue to next question
      |--------------------------------------------------------------------------
      */

      const updatedAttempt =
        await getAssessmentAttempt(
          student.id,
          campaign.id
        )

      if (!updatedAttempt) {
        return
      }

      await sendQuestion(
        ctx,
        campaign,
        nextQuestionIndex,
        updatedAttempt
      )
    } catch (error) {
      console.error(
        "ANSWER CALLBACK ERROR:",
        error
      )

      await ctx.reply(
        "Something went wrong while processing your answer. Please try again."
      )
    }
  }
)

/*
|--------------------------------------------------------------------------
| Finish Registration
|--------------------------------------------------------------------------
|
| This is used when the student answers the final
| assessment question.
|
*/

async function finishRegistration(
  ctx: any,
  attemptId: string
) {
  try {
    const registration =
      await completeRegistration(
        attemptId
      )

    /*
    |--------------------------------------------------------------------------
    | Eligible
    |--------------------------------------------------------------------------
    */

    if (
      registration.result ===
      "ELIGIBLE"
    ) {
      await ctx.reply(
        `Your registration is complete.\n\nYou are eligible for menstrual product support.\n\nParticipant Code: ${registration.participant.participant_code}\n\nPlease keep this information safe. Your QR code will be used during distribution.`
      )

      await ctx.reply(
        `Your QR code token is:\n${registration.qrCode.qr_token}`
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Not Eligible
    |--------------------------------------------------------------------------
    */

    if (
      registration.result ===
      "NOT_ELIGIBLE"
    ) {
      await ctx.reply(
        `Your registration has been completed, but you are not eligible for this campaign.\n\nReason: ${
          registration.reason ||
          "You did not meet the eligibility requirements."
        }`
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Needs Review
    |--------------------------------------------------------------------------
    */

    if (
      registration.result ===
      "NEEDS_REVIEW"
    ) {
      await ctx.reply(
        `Your registration has been submitted and needs further review.\n\nReason: ${
          registration.reason ||
          "Your assessment could not be automatically verified."
        }`
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Already Registered
    |--------------------------------------------------------------------------
    */

    if (
      registration.result ===
      "ALREADY_REGISTERED"
    ) {
      await ctx.reply(
        "Your registration for this campaign is already completed."
      )

      return
    }
  } catch (error) {
    console.error(
      "FINISH REGISTRATION ERROR:",
      error
    )

    await ctx.reply(
      "Something went wrong while completing your registration. Please try again."
    )
  }
}