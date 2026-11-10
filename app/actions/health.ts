"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function createDoctor(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim()
  const telegramIdValue = String(formData.get("telegram_id") ?? "").trim()
  const categoryId = String(formData.get("category_id") ?? "").trim()

  if (!fullName) {
    throw new Error("Doctor name is required.")
  }

  if (telegramIdValue && !/^\d+$/.test(telegramIdValue)) {
    throw new Error("Telegram ID must be a number.")
  }

  await prisma.doctors.create({
    data: {
      full_name: fullName,
      telegram_id: telegramIdValue ? BigInt(telegramIdValue) : null,
      category_id: categoryId || null,
    },
  })

  revalidatePath("/dashboard/health")
}

export async function toggleDoctor(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("Doctor ID is required.")
  }

  const doctor = await prisma.doctors.findUnique({ where: { id } })

  if (!doctor) {
    throw new Error("Doctor not found.")
  }

  await prisma.doctors.update({
    where: { id },
    data: { is_active: !doctor.is_active },
  })

  revalidatePath("/dashboard/health")
}

export async function assignHealthQuestion(formData: FormData) {
  const questionId = String(formData.get("question_id") ?? "").trim()
  const doctorId = String(formData.get("doctor_id") ?? "").trim()

  if (!questionId || !doctorId) {
    throw new Error("Question and doctor are required.")
  }

  const doctor = await prisma.doctors.findUnique({
    where: { id: doctorId },
  })

  if (!doctor || !doctor.is_active) {
    throw new Error("Doctor not found or inactive.")
  }

  // The bot is imported lazily because creating it requires
  // TELEGRAM_BOT_TOKEN, which is absent in some build environments.
  const { assignAndNotifyDoctor } = await import("@/telegram/bot")

  await assignAndNotifyDoctor(questionId, doctorId)

  revalidatePath("/dashboard/health")
}

export async function setStoryStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()
  const status = String(formData.get("status") ?? "").trim()

  if (!id) {
    throw new Error("Story ID is required.")
  }

  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new Error("Invalid status.")
  }

  await prisma.anonymous_stories.update({
    where: { id },
    data: { status },
  })

  revalidatePath("/dashboard/health")
}
