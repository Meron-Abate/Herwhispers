"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { isProductCategory } from "@/lib/productCategories"

const LIST_PATH = "/dashboard/Products"

function readCategory(formData: FormData) {
  const value = String(formData.get("category") ?? "").trim()

  if (!isProductCategory(value)) {
    throw new Error("Choose a valid product category.")
  }

  return value
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim() || "piece"
  const is_active = formData.get("is_active") === "on"
  const category = readCategory(formData)

  if (!name) {
    throw new Error("Product name is required.")
  }

  await prisma.products.create({
    data: {
      name,
      description: description || null,
      unit,
      category,
      is_active,
    },
  })

  revalidatePath(LIST_PATH)
  redirect(LIST_PATH)
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim() || "piece"
  const is_active = formData.get("is_active") === "on"

  if (!id) {
    throw new Error("Product ID is required.")
  }

  if (!name) {
    throw new Error("Product name is required.")
  }

  await prisma.products.update({
    where: { id },
    data: {
      name,
      description: description || null,
      unit,
      category: readCategory(formData),
      is_active,
      updated_at: new Date(),
    },
  })

  revalidatePath(LIST_PATH)
  redirect(LIST_PATH)
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()

  if (!id) {
    throw new Error("Product ID is required.")
  }

  const [campaignProducts, contributions] = await Promise.all([
    prisma.campaign_products.count({ where: { product_id: id } }),
    prisma.partner_contributions.count({ where: { product_id: id } }),
  ])

  if (campaignProducts > 0 || contributions > 0) {
    throw new Error(
      "Cannot delete this product because it is used in campaigns or partner contributions."
    )
  }

  await prisma.products.delete({ where: { id } })

  revalidatePath(LIST_PATH)
}
