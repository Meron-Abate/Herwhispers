export const PRODUCT_CATEGORIES = [
  "DISPOSABLE_PAD",
  "REUSABLE_PAD",
  "TAMPON",
  "OTHER",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  DISPOSABLE_PAD: "Disposable pad",
  REUSABLE_PAD: "Reusable pad",
  TAMPON: "Tampon",
  OTHER: "Other",
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}

export function categoryLabel(category: string | null | undefined) {
  return isProductCategory(category ?? "")
    ? PRODUCT_CATEGORY_LABELS[category as ProductCategory]
    : "Other"
}
