"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

function parseTelegramId(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim()

  if (!raw) {
    throw new Error("Telegram ID is required.")
  }

  try {
    return BigInt(raw)
  } catch {
    throw new Error("Telegram ID must be a number.")
  }
}

export async function createStudent(formData: FormData) {
  const telegram_id = parseTelegramId(formData.get("telegram_id"))
  const telegram_username = String(formData.get("telegram_username") ?? "").trim()
  const first_name = String(formData.get("first_name") ?? "").trim()
  const last_name = String(formData.get("last_name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const university_id = String(formData.get("university_id") ?? "").trim()

  await prisma.students.create({
    data: {
      telegram_id,
      telegram_username: telegram_username || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      university_id: university_id || null,
    },
  })

  revalidatePath("/dashboard/students")
  redirect("/dashboard/students")
}

export async function updateStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("Student ID is required.")
  }

  const telegram_username = String(formData.get("telegram_username") ?? "").trim()
  const first_name = String(formData.get("first_name") ?? "").trim()
  const last_name = String(formData.get("last_name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const university_id = String(formData.get("university_id") ?? "").trim()

  await prisma.students.update({
    where: { id },
    data: {
      telegram_username: telegram_username || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      university_id: university_id || null,
      updated_at: new Date(),
    },
  })

  revalidatePath("/dashboard/students")
  redirect("/dashboard/students")
}

export async function deleteStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("Student ID is required.")
  }

  const [attempts, participants] = await Promise.all([
    prisma.assessment_attempts.count({ where: { student_id: id } }),
    prisma.participants.count({ where: { student_id: id } }),
  ])

  if (attempts > 0 || participants > 0) {
    throw new Error(
      "Cannot delete this student because they have assessment attempts or campaign participation records."
    )
  }

  await prisma.students.delete({ where: { id } })

  revalidatePath("/dashboard/students")
}
