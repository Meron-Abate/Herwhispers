import { Bot, InlineKeyboard, InputFile } from "grammy"
import QRCode from "qrcode"

import { prisma } from "@/lib/prisma"

import {
  getActiveCampaign as fetchActiveCampaign,
} from "@/lib/campaigns"

import {
  getOrCreateStudent as fetchOrCreateStudent,
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
  getActiveHealthCategories,
  setBotState,
  getBotState,
  clearBotState,
  createHealthQuestion,
  createAnonymousStory,
  findDoctorByTelegramId,
  saveDoctorAnswer,
  assignDoctor,
} from "@/lib/health"

import {
  mainMenuKeyboard,
} from "@/telegram/keyboards/mainMenu"

export const bot = new Bot(
  process.env.TELEGRAM_BOT_TOKEN!
)

/*
|--------------------------------------------------------------------------
| Short-lived caches
|--------------------------------------------------------------------------
|
| Every button tap used to re-run the campaign status sync, the
| deep campaign query and the student lookup against a remote
| database. Those results barely change, so they are cached for a
| few seconds. Dashboard edits show up in the bot after the TTL.
|
*/

const CAMPAIGN_TTL_MS = 15_000
const STUDENT_TTL_MS = 60_000

let campaignCache: {
  value: Awaited<ReturnType<typeof fetchActiveCampaign>>
  expires: number
} | null = null

async function getActiveCampaign() {
  if (campaignCache && campaignCache.expires > Date.now()) {
    return campaignCache.value
  }

  const value = await fetchActiveCampaign()

  campaignCache = {
    value,
    expires: Date.now() + CAMPAIGN_TTL_MS,
  }

  return value
}

const studentCache = new Map<
  string,
  {
    value: Awaited<ReturnType<typeof fetchOrCreateStudent>>
    expires: number
  }
>()

async function getOrCreateStudent(data: { telegramId: bigint }) {
  const key = data.telegramId.toString()
  const cached = studentCache.get(key)

  if (cached && cached.expires > Date.now()) {
    return cached.value
  }

  const value = await fetchOrCreateStudent(data)

  studentCache.set(key, {
    value,
    expires: Date.now() + STUDENT_TTL_MS,
  })

  return value
}

/*
|--------------------------------------------------------------------------
| Option markers
|--------------------------------------------------------------------------
|
| Single choice questions use radio markers, multiple choice
| questions use checkboxes.
|
*/

const RADIO_OFF = "○"
const RADIO_ON = "◉"
const CHECK_OFF = "☐"
const CHECK_ON = "☑"

function multiChoiceKeyboard(
  question: any,
  selectedOptionIds: Set<string>
) {
  const keyboard = new InlineKeyboard()

  for (const option of question.answer_options) {
    const marker = selectedOptionIds.has(option.id)
      ? CHECK_ON
      : CHECK_OFF

    keyboard
      .text(`${marker} ${option.label}`, `multi:${option.id}`)
      .row()
  }

  keyboard.text("Continue", `multi_continue:${question.id}`)

  return keyboard
}

/**
 * Reads the currently selected options from the message's own
 * buttons, so a tap can be reflected without waiting for the
 * database.
 */
function selectedFromMessage(ctx: any): Set<string> {
  const selected = new Set<string>()
  const rows =
    ctx.callbackQuery?.message?.reply_markup?.inline_keyboard ?? []

  for (const row of rows) {
    for (const button of row) {
      const match = /^multi:(.+)$/.exec(button.callback_data ?? "")

      if (match && button.text.startsWith(CHECK_ON)) {
        selected.add(match[1])
      }
    }
  }

  return selected
}

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
          `${RADIO_OFF} ${option.label}`,
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
      multiChoiceKeyboard(
        question,
        selectedOptionIds as Set<string>
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
    if (ctx.from) {
      await clearBotState(BigInt(ctx.from.id))
    }

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

const MAX_TEXT_LENGTH = 3000

async function sendCategoryPicker(
  ctx: any,
  prefix: "hq_cat" | "story_cat",
  prompt: string
) {
  const categories = await getActiveHealthCategories()

  if (categories.length === 0) {
    await ctx.reply(
      "This feature is not available right now. Please try again later."
    )
    return
  }

  const keyboard = new InlineKeyboard()

  for (const category of categories) {
    keyboard.text(category.name, `${prefix}:${category.id}`).row()
  }

  await ctx.reply(prompt, { reply_markup: keyboard })
}

bot.callbackQuery(
  "doctor_question",
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    await sendCategoryPicker(
      ctx,
      "hq_cat",
      "What is your question about? Choose a category:"
    )
  }
)

bot.callbackQuery(
  /^hq_cat:(.+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    await setBotState(BigInt(ctx.from.id), "health_question", {
      category_id: ctx.match[1],
    })

    await ctx.reply(
      "Please type your health question in one message.\n\n" +
        "Your name and Telegram details are never shared with the doctor. " +
        "The answer will be sent to you here in this chat.\n\n" +
        "Send /start to cancel."
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

    await sendCategoryPicker(
      ctx,
      "story_cat",
      "Choose the category that best fits your story:"
    )
  }
)

bot.callbackQuery(
  /^story_cat:(.+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    await setBotState(BigInt(ctx.from.id), "anonymous_story", {
      category_id: ctx.match[1],
    })

    await ctx.reply(
      "Please type your story in one message.\n\n" +
        "It is saved anonymously: we do not store your name, username or Telegram ID with it.\n\n" +
        "Send /start to cancel."
    )
  }
)

/*
|--------------------------------------------------------------------------
| Doctor reply
|--------------------------------------------------------------------------
*/

bot.callbackQuery(
  /^hq_reply:(.+)$/,
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery()
    } catch {
      // Ignore old Telegram callbacks.
    }

    const telegramId = BigInt(ctx.from.id)
    const doctor = await findDoctorByTelegramId(telegramId)

    if (!doctor) {
      await ctx.reply("You are not registered as a doctor.")
      return
    }

    await setBotState(telegramId, "doctor_reply", {
      question_id: ctx.match[1],
      doctor_id: doctor.id,
    })

    await ctx.reply(
      "Type your answer in one message and it will be sent to the student."
    )
  }
)

/**
 * Assigns a doctor to a question and sends it to them on Telegram.
 * Meant to be called from a dashboard action once assignment exists.
 */
export async function assignAndNotifyDoctor(
  questionId: string,
  doctorId: string
) {
  const question = await assignDoctor(questionId, doctorId)

  if (!question.doctors?.telegram_id) {
    return { notified: false }
  }

  await bot.api.sendMessage(
    question.doctors.telegram_id.toString(),
    `New ${question.health_categories.name} question:\n\n${question.question_text}`,
    {
      reply_markup: new InlineKeyboard().text(
        "Reply",
        `hq_reply:${question.id}`
      ),
    }
  )

  return { notified: true }
}

/*
|--------------------------------------------------------------------------
| Free text: health question, story and doctor reply
|--------------------------------------------------------------------------
*/

bot.on("message:text", async (ctx) => {
  const telegramId = BigInt(ctx.from.id)
  const state = await getBotState(telegramId)

  if (!state) {
    await ctx.reply(
      "Please choose an option from the menu.",
      { reply_markup: mainMenuKeyboard() }
    )
    return
  }

  const text = ctx.message.text.trim()
  const data = state.data as Record<string, string>

  if (text.length > MAX_TEXT_LENGTH) {
    await ctx.reply(
      `That message is too long. Please keep it under ${MAX_TEXT_LENGTH} characters.`
    )
    return
  }

  try {
    if (state.state === "health_question") {
      const student = await getOrCreateStudent({ telegramId })

      await createHealthQuestion({
        studentId: student.id,
        categoryId: data.category_id,
        text,
      })

      await clearBotState(telegramId)

      await ctx.reply(
        "Thank you. Your question has been received. A doctor will be assigned and the answer will be sent to you here.",
        { reply_markup: mainMenuKeyboard() }
      )
      return
    }

    if (state.state === "anonymous_story") {
      await createAnonymousStory({
        categoryId: data.category_id,
        text,
      })

      await clearBotState(telegramId)

      await ctx.reply(
        "Thank you for sharing. Your story was saved anonymously.",
        { reply_markup: mainMenuKeyboard() }
      )
      return
    }

    if (state.state === "doctor_reply") {
      const saved = await saveDoctorAnswer({
        questionId: data.question_id,
        doctorId: data.doctor_id,
        text,
      })

      await clearBotState(telegramId)

      if (!saved) {
        await ctx.reply("This question is not assigned to you.")
        return
      }

      await bot.api.sendMessage(
        saved.studentTelegramId.toString(),
        `A doctor answered your question.\n\nYour question:\n${saved.questionText}\n\nAnswer:\n${text}`
      )

      await ctx.reply("Your answer was sent to the student.")
    }
  } catch (error) {
    console.error("TEXT HANDLER ERROR:", error)

    await ctx.reply("Something went wrong. Please try again.")
  }
})

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
        const qrBuffer = await QRCode.toBuffer(
          completedParticipant.qr_codes.qr_token,
          {
            width: 400,
            margin: 2,
            errorCorrectionLevel: "H",
          }
        )

        await ctx.replyWithPhoto(
          new InputFile(
            qrBuffer,
            `herwhispers-${completedParticipant.participant_code}.png`
          ),
          {
            caption:
              `Your registration for this campaign is already completed.\n\n` +
              `Participant Code: ${completedParticipant.participant_code}\n\n` +
              `Here is your QR code for distribution.`,
          }
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
    // Acknowledge first so the tap feels instant.
    ctx.answerCallbackQuery().catch(() => {})

    try {
      const optionId = ctx.match[1]
      const campaign = await getActiveCampaign()

      const question = campaign?.assessments.questions.find(
        (q: any) =>
          q.answer_options.some((o: any) => o.id === optionId)
      )

      if (!campaign || !question) {
        await ctx.reply(
          "This answer is no longer available. Please start the registration again."
        )
        return
      }

      if (question.type !== "MULTIPLE_CHOICE") {
        return
      }

      // Update the buttons straight away and save in parallel.
      const selected = selectedFromMessage(ctx)

      if (selected.has(optionId)) {
        selected.delete(optionId)
      } else {
        selected.add(optionId)
      }

      const updateButtons = ctx
        .editMessageReplyMarkup({
          reply_markup: multiChoiceKeyboard(question, selected),
        })
        .catch((error) => {
          console.error(
            "Could not update multiple-choice buttons:",
            error
          )
        })

      const save = (async () => {
        const student = await getOrCreateStudent({
          telegramId: BigInt(ctx.from.id),
        })

        const attempt = await getAssessmentAttempt(
          student.id,
          campaign.id
        )

        if (!attempt || attempt.submitted_at) {
          return
        }

        await toggleMultipleChoiceAnswer(
          attempt.id,
          question.id,
          optionId
        )
      })()

      await Promise.all([updateButtons, save])
    } catch (error) {
      console.error("MULTIPLE CHOICE ERROR:", error)
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
    ctx.answerCallbackQuery().catch(() => {})

    try {
      const questionId = ctx.match[1]

      const student = await getOrCreateStudent({
        telegramId: BigInt(ctx.from.id),
      })

      const campaign = await getActiveCampaign()

      if (!campaign) {
        await ctx.reply("There is currently no active campaign.")
        return
      }

      const attempt = await getAssessmentAttempt(
        student.id,
        campaign.id
      )

      if (!attempt || attempt.submitted_at) {
        await ctx.reply(
          "Your registration could not be found or is already completed."
        )
        return
      }

      const questions = campaign.assessments.questions

      const questionIndex = questions.findIndex(
        (question: any) => question.id === questionId
      )

      if (questionIndex === -1) {
        await ctx.reply("This question could not be found.")
        return
      }

      if (questions[questionIndex].type !== "MULTIPLE_CHOICE") {
        return
      }

      const hasSelection = attempt.assessment_answers.some(
        (answer) => answer.question_id === questionId
      )

      if (!hasSelection) {
        await ctx
          .answerCallbackQuery({
            text: "Please select at least one option.",
            show_alert: true,
          })
          .catch(() => {})

        return
      }

      // Lock the answered message so it cannot be continued twice.
      ctx
        .editMessageReplyMarkup({
          reply_markup: new InlineKeyboard(),
        })
        .catch(() => {})

      const nextQuestionIndex = questionIndex + 1

      if (nextQuestionIndex >= questions.length) {
        await finishRegistration(ctx, attempt.id)
        return
      }

      await sendQuestion(ctx, campaign, nextQuestionIndex, attempt)
    } catch (error) {
      console.error("MULTIPLE CHOICE CONTINUE ERROR:", error)

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
*/

bot.callbackQuery(
  /^answer:([^:]+)$/,
  async (ctx) => {
    ctx.answerCallbackQuery().catch(() => {})

    try {
      const optionId = ctx.match[1]

      const student = await getOrCreateStudent({
        telegramId: BigInt(ctx.from.id),
      })

      const campaign = await getActiveCampaign()

      if (!campaign) {
        await ctx.reply("There is currently no active campaign.")
        return
      }

      const questions = campaign.assessments.questions

      const questionIndex = questions.findIndex((q: any) =>
        q.answer_options.some((o: any) => o.id === optionId)
      )

      if (questionIndex === -1) {
        await ctx.reply(
          "This answer is no longer available. Please start the registration again."
        )
        return
      }

      const question = questions[questionIndex]

      if (question.type !== "SINGLE_CHOICE") {
        return
      }

      const attempt = await getAssessmentAttempt(
        student.id,
        campaign.id
      )

      if (!attempt || attempt.submitted_at) {
        await ctx.reply(
          "Your registration could not be found or is already completed."
        )
        return
      }

      const alreadyAnswered = attempt.assessment_answers.some(
        (answer) => answer.question_id === question.id
      )

      if (alreadyAnswered) {
        return
      }

      // Show the chosen radio and drop the other buttons straight
      // away while the answer is saved.
      const chosen = question.answer_options.find(
        (option: any) => option.id === optionId
      )

      if (!chosen) {
        await ctx.reply("This answer could not be found.")
        return
      }

      const showChoice = ctx
        .editMessageReplyMarkup({
          reply_markup: new InlineKeyboard().text(
            `${RADIO_ON} ${chosen.label}`,
            "noop"
          ),
        })
        .catch(() => {})

      await Promise.all([
        showChoice,
        saveSingleChoiceAnswer(attempt.id, question.id, optionId),
      ])

      const nextQuestionIndex = questionIndex + 1

      if (nextQuestionIndex >= questions.length) {
        await finishRegistration(ctx, attempt.id)
        return
      }

      await sendQuestion(ctx, campaign, nextQuestionIndex, attempt)
    } catch (error) {
      console.error("ANSWER CALLBACK ERROR:", error)

      await ctx.reply(
        "Something went wrong while processing your answer. Please try again."
      )
    }
  }
)

bot.callbackQuery("noop", (ctx) =>
  ctx.answerCallbackQuery().catch(() => {})
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
      const qrBuffer = await QRCode.toBuffer(
        registration.qrCode.qr_token,
        {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H",
        }
      )

      await ctx.replyWithPhoto(
        new InputFile(
          qrBuffer,
          `herwhispers-${registration.participant.participant_code}.png`
        ),
        {
          caption:
            `Your registration is complete.\n\n` +
            `You are eligible for menstrual product support.\n\n` +
            `Participant Code: ${registration.participant.participant_code}\n\n` +
            `Please keep this QR code safe. Show it during distribution to receive your support.`,
        }
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
      if (registration.qrCode?.qr_token) {
        const qrBuffer = await QRCode.toBuffer(
          registration.qrCode.qr_token,
          {
            width: 400,
            margin: 2,
            errorCorrectionLevel: "H",
          }
        )

        await ctx.replyWithPhoto(
          new InputFile(
            qrBuffer,
            `herwhispers-${registration.participant.participant_code}.png`
          ),
          {
            caption:
              `Your registration for this campaign is already completed.\n\n` +
              `Participant Code: ${registration.participant.participant_code}\n\n` +
              `Here is your QR code for distribution.`,
          }
        )
      } else {
        await ctx.reply(
          "Your registration for this campaign is already completed."
        )
      }

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