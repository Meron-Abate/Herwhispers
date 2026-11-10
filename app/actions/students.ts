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

export type DeleteStudentResult = {
  ok: boolean
  error?: string
}

/**
 * Removes a student together with their assessment attempts, answers,
 * participation and QR code, so they can register again from scratch.
 * Students who have been allocated or given products are kept: deleting
 * them would remove stock records.
 */
export async function removeStudent(
  id: string
): Promise<DeleteStudentResult> {
  if (!id) {
    return { ok: false, error: "Student ID is required." }
  }

  const participants = await prisma.participants.findMany({
    where: { student_id: id },
    select: { id: true },
  })

  const participantIds = participants.map((participant) => participant.id)

  if (participantIds.length > 0) {
    const [allocations, distributions] = await Promise.all([
      prisma.allocations.count({
        where: { participant_id: { in: participantIds } },
      }),
      prisma.distributions.count({
        where: { participant_id: { in: participantIds } },
      }),
    ])

    if (allocations > 0 || distributions > 0) {
      return {
        ok: false,
        error:
          "This student has been allocated or given products, so they can't be deleted.",
      }
    }
  }

  try {
    await prisma.$transaction([
      prisma.qr_codes.deleteMany({
        where: { participant_id: { in: participantIds } },
      }),
      prisma.waiting_list.deleteMany({
        where: { participant_id: { in: participantIds } },
      }),
      prisma.participants.deleteMany({ where: { student_id: id } }),
      prisma.assessment_answers.deleteMany({
        where: { assessment_attempts: { student_id: id } },
      }),
      prisma.assessment_attempts.deleteMany({ where: { student_id: id } }),
      prisma.students.delete({ where: { id } }),
    ])
  } catch (error) {
    console.error("STUDENT DELETE ERROR:", error)

    return { ok: false, error: "Could not delete the student." }
  }

  revalidatePath("/dashboard/students")
  revalidatePath("/dashboard/participants")

  return { ok: true }
}
