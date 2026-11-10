"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { ensureCategoryProduct, getInventory } from "@/lib/inventory"
import { isProductCategory } from "@/lib/productCategories"

export type InventoryActionResult = {
  ok: boolean
  error?: string
}

function refresh() {
  revalidatePath("/dashboard/Products")
  revalidatePath("/dashboard/equal-allocations")
  revalidatePath("/dashboard/allocations")
}

/**
 * Gives a campaign a share of the stock pool for one category.
 * The quantity is added to whatever the campaign already has.
 */
export async function assignStockToCampaign(
  _prev: InventoryActionResult,
  formData: FormData
): Promise<InventoryActionResult> {
  const category = String(formData.get("category") ?? "").trim()
  const campaignId = String(formData.get("campaign_id") ?? "").trim()
  const quantity = Number(formData.get("quantity"))

  if (!isProductCategory(category)) {
    return { ok: false, error: "Choose a category." }
  }

  if (!campaignId) {
    return { ok: false, error: "Choose a campaign." }
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: "Quantity must be a whole number above 0." }
  }

  const { categories } = await getInventory()
  const stock = categories.find((item) => item.category === category)

  if (!stock || quantity > stock.unassigned) {
    return {
      ok: false,
      error: `Exceeds the inventory: only ${stock?.unassigned ?? 0} are available in this category.`,
    }
  }

  // Reuse the campaign's existing product for this category if it has one.
  const existing = await prisma.campaign_products.findFirst({
    where: { campaign_id: campaignId, products: { category } },
    orderBy: { assigned_quantity: "desc" },
  })

  if (existing) {
    await prisma.campaign_products.update({
      where: { id: existing.id },
      data: { assigned_quantity: { increment: quantity } },
    })
  } else {
    const product = await ensureCategoryProduct(category)

    await prisma.campaign_products.create({
      data: {
        campaign_id: campaignId,
        product_id: product.id,
        assigned_quantity: quantity,
      },
    })
  }

  refresh()

  return { ok: true }
}

/**
 * Sets a campaign's share of a category to an exact number. It can't go
 * below what has already been allocated to participants, or above what
 * the pool can cover.
 */
export async function setCampaignStock(
  campaignProductId: string,
  quantity: number
): Promise<InventoryActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, error: "Quantity must be a whole number, 0 or more." }
  }

  const { categories, assignments } = await getInventory()
  const row = assignments.find(
    (item) => item.campaignProductId === campaignProductId
  )

  if (!row) {
    return { ok: false, error: "That assignment no longer exists." }
  }

  if (quantity < row.allocated) {
    return {
      ok: false,
      error: `${row.allocated} are already allocated to participants, so this can't go below ${row.allocated}.`,
    }
  }

  const stock = categories.find((item) => item.category === row.category)
  const increase = quantity - row.assigned

  if (stock && increase > stock.unassigned) {
    return {
      ok: false,
      error: `Exceeds the inventory: only ${stock.unassigned} more are available in this category.`,
    }
  }

  await prisma.campaign_products.update({
    where: { id: campaignProductId },
    data: { assigned_quantity: quantity },
  })

  refresh()

  return { ok: true }
}
