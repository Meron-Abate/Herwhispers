"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

const LIST_PATH = "/dashboard/Partners"

export async function createPartner(formData: FormData) {
  const company_name = String(formData.get("company_name") ?? "").trim()
  const contact_person = String(formData.get("contact_person") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const is_active = formData.get("is_active") === "on"

  if (!company_name) {
    throw new Error("Company name is required.")
  }

  await prisma.partners.create({
    data: {
      company_name,
      contact_person: contact_person || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      is_active,
    },
  })

  revalidatePath(LIST_PATH)
  redirect(LIST_PATH)
}

export async function updatePartner(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()
  const company_name = String(formData.get("company_name") ?? "").trim()
  const contact_person = String(formData.get("contact_person") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const is_active = formData.get("is_active") === "on"

  if (!id) {
    throw new Error("Partner ID is required.")
  }

  if (!company_name) {
    throw new Error("Company name is required.")
  }

  await prisma.partners.update({
    where: { id },
    data: {
      company_name,
      contact_person: contact_person || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      is_active,
      updated_at: new Date(),
    },
  })

  revalidatePath(LIST_PATH)
  redirect(LIST_PATH)
}

export async function deletePartner(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("Partner ID is required.")
  }

  const contributions = await prisma.partner_contributions.count({
    where: { partner_id: id },
  })

  if (contributions > 0) {
    throw new Error(
      "Cannot delete this partner because campaign contributions are linked to it."
    )
  }

  await prisma.partners.delete({ where: { id } })

  revalidatePath(LIST_PATH)
}
