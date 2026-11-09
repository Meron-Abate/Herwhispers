"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function createUniversity(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const code = String(formData.get("code") ?? "").trim()
  const is_active = formData.get("is_active") === "on"

  if (!name) {
    throw new Error("University name is required.")
  }

  if (!code) {
    throw new Error("University code is required.")
  }

  await prisma.universities.create({
    data: { name, code, is_active },
  })

  revalidatePath("/dashboard/universities")
  redirect("/dashboard/universities")
}

export async function updateUniversity(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const code = String(formData.get("code") ?? "").trim()
  const is_active = formData.get("is_active") === "on"

  if (!id) {
    throw new Error("University ID is required.")
  }

  if (!name) {
    throw new Error("University name is required.")
  }

  if (!code) {
    throw new Error("University code is required.")
  }

  await prisma.universities.update({
    where: { id },
    data: {
      name,
      code,
      is_active,
      updated_at: new Date(),
    },
  })

  revalidatePath("/dashboard/universities")
  redirect("/dashboard/universities")
}

export async function deleteUniversity(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("University ID is required.")
  }

  const [students, links] = await Promise.all([
    prisma.students.count({ where: { university_id: id } }),
    prisma.assessment_universities.count({ where: { university_id: id } }),
  ])

  if (students > 0 || links > 0) {
    throw new Error(
      "Cannot delete this university because students or assessments are linked to it."
    )
  }

  await prisma.universities.delete({ where: { id } })

  revalidatePath("/dashboard/universities")
}
