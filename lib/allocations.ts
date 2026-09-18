import { prisma } from "@/lib/prisma"

export async function createEqualAllocations(
  campaignId: string,
  campaignProductId: string,
  availableQuantity: number
) {
  if (!Number.isInteger(availableQuantity)) {
    throw new Error(
      "Available quantity must be a whole number."
    )
  }

  if (availableQuantity <= 0) {
    throw new Error(
      "Available quantity must be greater than zero."
    )
  }

  const campaignProduct =
    await prisma.campaign_products.findFirst({
      where: {
        id: campaignProductId,
        campaign_id: campaignId,
      },
    })

  if (!campaignProduct) {
    throw new Error(
      "Campaign product not found."
    )
  }

  const participants =
    await prisma.participants.findMany({
      where: {
        campaign_id: campaignId,
        status: {
          in: [
            "VERIFIED",
            "ALLOCATED",
          ],
        },
      },
      orderBy: {
        registered_at: "asc",
      },
    })

  if (participants.length === 0) {
    throw new Error(
      "No eligible participants found."
    )
  }

  const quantityPerParticipant = Math.floor(
    availableQuantity /
      participants.length
  )

  if (quantityPerParticipant <= 0) {
    throw new Error(
      "There is not enough product to allocate at least one unit to each participant."
    )
  }

  const existingAllocations =
    await prisma.allocations.findMany({
      where: {
        campaign_id: campaignId,
        campaign_product_id:
          campaignProductId,
      },
      select: {
        participant_id: true,
      },
    })

  const alreadyAllocated = new Set(
    existingAllocations.map(
      (allocation) =>
        allocation.participant_id
    )
  )

  const newParticipants =
    participants.filter(
      (participant) =>
        !alreadyAllocated.has(
          participant.id
        )
    )

  if (newParticipants.length === 0) {
    return []
  }

  const allocations =
    await prisma.$transaction(
      newParticipants.map(
        (participant) =>
          prisma.allocations.create({
            data: {
              participant_id:
                participant.id,

              campaign_id:
                campaignId,

              campaign_product_id:
                campaignProductId,

              quantity:
                quantityPerParticipant,

              status: "PROPOSED",
            },
          })
      )
    )

  await prisma.participants.updateMany({
    where: {
      id: {
        in: newParticipants.map(
          (participant) =>
            participant.id
        ),
      },
    },

    data: {
      status: "ALLOCATED",
    },
  })

  return allocations
}