"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

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
