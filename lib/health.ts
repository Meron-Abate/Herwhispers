import { prisma } from "@/lib/prisma"

export type BotStateName =
  | "health_question"
  | "anonymous_story"
  | "doctor_reply"

export async function getActiveHealthCategories() {
  return prisma.health_categories.findMany({
    where: { is_active: true },
    orderBy: { sort_order: "asc" },
  })
}

export async function setBotState(
  telegramId: bigint,
  state: BotStateName,
  data: Record<string, string>
) {
  await prisma.bot_states.upsert({
    where: { telegram_id: telegramId },
    create: { telegram_id: telegramId, state, data },
    update: { state, data, updated_at: new Date() },
  })
}

export async function getBotState(telegramId: bigint) {
  return prisma.bot_states.findUnique({
    where: { telegram_id: telegramId },
  })
}

export async function clearBotState(telegramId: bigint) {
  await prisma.bot_states.deleteMany({
    where: { telegram_id: telegramId },
  })
}

export async function createHealthQuestion(input: {
  studentId: string
  categoryId: string
  text: string
}) {
  return prisma.health_questions.create({
    data: {
      student_id: input.studentId,
      category_id: input.categoryId,
      question_text: input.text,
    },
  })
}

export async function createAnonymousStory(input: {
  categoryId: string
  text: string
}) {
  return prisma.anonymous_stories.create({
    data: {
      category_id: input.categoryId,
      story_text: input.text,
    },
  })
}

export async function findDoctorByTelegramId(telegramId: bigint) {
  return prisma.doctors.findFirst({
    where: { telegram_id: telegramId, is_active: true },
  })
}

/**
 * Saves a doctor's reply. Only the doctor assigned to the question
 * may answer it. Returns the student's Telegram id so the bot can
 * relay the reply without ever exposing the student to the doctor.
 */
export async function saveDoctorAnswer(input: {
  questionId: string
  doctorId: string
  text: string
}) {
  const question = await prisma.health_questions.findUnique({
    where: { id: input.questionId },
    include: { students: true },
  })

  if (
    !question ||
    question.assigned_doctor_id !== input.doctorId
  ) {
    return null
  }

  await prisma.$transaction([
    prisma.health_answers.create({
      data: {
        question_id: question.id,
        doctor_id: input.doctorId,
        answer_text: input.text,
      },
    }),
    prisma.health_questions.update({
      where: { id: question.id },
      data: { status: "ANSWERED", answered_at: new Date() },
    }),
  ])

  return {
    studentTelegramId: question.students.telegram_id,
    questionText: question.question_text,
  }
}

/**
 * Assigns a doctor to a question. The caller is responsible for
 * notifying the doctor; see assignAndNotifyDoctor in telegram/bot.ts.
 */
export async function assignDoctor(
  questionId: string,
  doctorId: string
) {
  return prisma.health_questions.update({
    where: { id: questionId },
    data: { assigned_doctor_id: doctorId, status: "ASSIGNED" },
    include: { doctors: true, health_categories: true },
  })
}
