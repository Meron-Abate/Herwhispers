"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createEqualAllocations } from "@/lib/allocations"

const LIST_PATH = "/dashboard/allocations"

export async function triggerEqualAllocation(
  campaignId: string,
  campaignProductId: string
) {
  // Available quantity is derived on the server from delivered partner
  // contributions minus existing allocations, never from the client.
  await createEqualAllocations(
    campaignId,
    campaignProductId
  )

  revalidatePath(LIST_PATH)
  revalidatePath("/dashboard/participants")
  revalidatePath("/dashboard/equal-allocations", "layout")

  redirect(LIST_PATH)
}

export async function approveAllocation(
  allocationId: string
) {
  // updateMany with the PROPOSED guard makes repeated clicks a no-op
  // instead of overwriting an already confirmed/cancelled record.
  await prisma.allocations.updateMany({
    where: {
      id: allocationId,
      status: "PROPOSED",
    },
    data: {
      status: "CONFIRMED",
      confirmed_at: new Date(),
    },
  })

  revalidatePath(LIST_PATH)
}
