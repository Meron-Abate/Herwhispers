import { prisma } from "@/lib/prisma"

type TelegramStudentData = {
  telegramId: bigint
}

export async function findStudentByTelegramId(
  telegramId: bigint
) {
  return prisma.students.findUnique({
    where: {
      telegram_id: telegramId,
    },
  })
}

export async function getOrCreateStudent(
  data: TelegramStudentData
) {
  const existingStudent =
    await findStudentByTelegramId(data.telegramId)

  if (existingStudent) {
    return existingStudent
  }

  return prisma.students.create({
    data: {
      telegram_id: data.telegramId,
    },
  })
}