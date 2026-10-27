"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createEqualAllocations } from "@/lib/allocations"

const LIST_PATH = "/dashboard/allocations"

export async function triggerEqualAllocation(
  campaignId: string,
  campaignProductId: string,
  availableQuantity: number
) {
  if (!availableQuantity || availableQuantity <= 0) {
    throw new Error("Available quantity must be greater than zero.")
  }

  const createdAllocations =
    await createEqualAllocations(
      campaignId,
      campaignProductId,
      availableQuantity
    )

  revalidatePath(LIST_PATH)

  if (createdAllocations.length === 0) {
    throw new Error(
      "No new allocations created - all eligible participants already have allocations or there are no eligible participants."
    )
  }

  redirect(LIST_PATH)
}