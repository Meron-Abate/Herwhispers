import { prisma } from "@/lib/prisma"
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/productCategories"

export type CategoryStock = {
  category: ProductCategory
  /** Delivered by partners. Only DELIVERED contributions count as stock. */
  delivered: number
  /** Promised by partners but not delivered yet. */
  expected: number
  /** Stock already assigned to campaigns. */
  assigned: number
  /** Delivered stock that no campaign has claimed yet. */
  unassigned: number
}

export type CampaignStockRow = {
  campaignProductId: string
  campaignId: string
  campaignName: string
  category: ProductCategory
  productName: string
  assigned: number
  /** Already allocated to participants (not cancelled). */
  allocated: number
}

/**
 * Stock is counted per category, not per product: partners donate "X
 * reusable pads", and campaigns are given a share of that pool.
 */
export async function getInventory() {
  const [contributions, campaignProducts] = await Promise.all([
    prisma.partner_contributions.findMany({
      select: {
        quantity: true,
        delivery_status: true,
        products: { select: { category: true } },
      },
    }),
    prisma.campaign_products.findMany({
      include: {
        campaigns: { select: { id: true, name: true } },
        products: { select: { name: true, category: true } },
        allocations: { select: { quantity: true, status: true } },
      },
    }),
  ])

  const categories: CategoryStock[] = PRODUCT_CATEGORIES.map((category) => {
    const inCategory = contributions.filter(
      (contribution) => contribution.products.category === category
    )

    const delivered = inCategory
      .filter((contribution) => contribution.delivery_status === "DELIVERED")
      .reduce((sum, contribution) => sum + contribution.quantity, 0)

    const expected = inCategory
      .filter(
        (contribution) =>
          contribution.delivery_status === "PENDING" ||
          contribution.delivery_status === "PARTIALLY_DELIVERED"
      )
      .reduce((sum, contribution) => sum + contribution.quantity, 0)

    const assigned = campaignProducts
      .filter((row) => row.products.category === category)
      .reduce((sum, row) => sum + row.assigned_quantity, 0)

    return {
      category,
      delivered,
      expected,
      assigned,
      unassigned: Math.max(delivered - assigned, 0),
    }
  })

  const assignments: CampaignStockRow[] = campaignProducts.map((row) => ({
    campaignProductId: row.id,
    campaignId: row.campaigns.id,
    campaignName: row.campaigns.name,
    category: row.products.category as ProductCategory,
    productName: row.products.name,
    assigned: row.assigned_quantity,
    allocated: row.allocations
      .filter((allocation) => allocation.status !== "CANCELLED")
      .reduce((sum, allocation) => sum + allocation.quantity, 0),
  }))

  return { categories, assignments }
}

/**
 * The product that stands for a whole category. Reuses the oldest active
 * product of that category, or creates one named after the category.
 */
export async function ensureCategoryProduct(category: ProductCategory) {
  const existing = await prisma.products.findFirst({
    where: { category, is_active: true },
    orderBy: { created_at: "asc" },
  })

  if (existing) {
    return existing
  }

  return prisma.products.create({
    data: {
      name: PRODUCT_CATEGORY_LABELS[category],
      category,
      unit: "piece",
    },
  })
}
