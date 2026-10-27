import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

/**
 * Participants who can still receive an allocation. SUPPORTED, WAITING_LIST
 * and CANCELLED participants are excluded.
 */
const ELIGIBLE_PARTICIPANT_STATUSES: Array<
  "VERIFIED" | "ALLOCATED"
> = ["VERIFIED", "ALLOCATED"]

type DbClient = Prisma.TransactionClient

export type EqualAllocationSplit = {
  quantityPerParticipant: number
  remainderQuantity: number
}

export type EqualAllocationPreview = {
  contributedQuantity: number
  allocatedQuantity: number
  availableQuantity: number
  eligibleParticipantCount: number
  quantityPerParticipant: number
  remainderQuantity: number
}

export type EqualAllocationResult = EqualAllocationPreview & {
  createdCount: number
}

/**
 * Approved equal allocation rule: every eligible participant receives the
 * same whole-number quantity. Any quantity that cannot be divided evenly
 * stays unallocated - it is never given to a participant with a higher
 * assessment score or any other priority.
 */
export function splitEqually(
  availableQuantity: number,
  participantCount: number
): EqualAllocationSplit {
  if (
    !Number.isInteger(availableQuantity) ||
    availableQuantity < 0
  ) {
    throw new Error(
      "Available quantity must be a non-negative whole number."
    )
  }

  if (
    !Number.isInteger(participantCount) ||
    participantCount < 0
  ) {
    throw new Error(
      "Participant count must be a non-negative whole number."
    )
  }

  if (participantCount === 0) {
    return {
      quantityPerParticipant: 0,
      remainderQuantity: 0,
    }
  }

  const quantityPerParticipant = Math.floor(
    availableQuantity / participantCount
  )

  return {
    quantityPerParticipant,
    remainderQuantity:
      availableQuantity -
      quantityPerParticipant * participantCount,
  }
}

async function findCampaignProduct(
  db: DbClient,
  campaignId: string,
  campaignProductId: string
) {
  return db.campaign_products.findFirst({
    where: {
      id: campaignProductId,
      campaign_id: campaignId,
    },
    select: {
      id: true,
      product_id: true,
    },
  })
}

/**
 * Available quantity = delivered partner contributions for the campaign
 * product, minus quantities already committed by non-cancelled allocations.
 * Only DELIVERED contributions count: partially delivered contributions have
 * no delivered-quantity field, so counting them would overstate stock.
 */
async function getQuantityBalance(
  db: DbClient,
  campaignId: string,
  campaignProduct: {
    id: string
    product_id: string
  }
) {
  const [contributions, allocations] =
    await Promise.all([
      db.partner_contributions.aggregate({
        where: {
          campaign_id: campaignId,
          product_id: campaignProduct.product_id,
          delivery_status: "DELIVERED",
        },
        _sum: {
          quantity: true,
        },
      }),

      db.allocations.aggregate({
        where: {
          campaign_id: campaignId,
          campaign_product_id:
            campaignProduct.id,
          status: {
            not: "CANCELLED",
          },
        },
        _sum: {
          quantity: true,
        },
      }),
    ])

  const contributedQuantity =
    contributions._sum.quantity ?? 0

  const allocatedQuantity =
    allocations._sum.quantity ?? 0

  return {
    contributedQuantity,
    allocatedQuantity,
    availableQuantity: Math.max(
      contributedQuantity - allocatedQuantity,
      0
    ),
  }
}

function eligibleParticipantsWhere(
  campaignId: string,
  campaignProductId: string
): Prisma.participantsWhereInput {
  return {
    campaign_id: campaignId,
    status: {
      in: ELIGIBLE_PARTICIPANT_STATUSES,
    },

    // A participant who already has any allocation record for this
    // campaign product is never allocated twice.
    allocations: {
      none: {
        campaign_id: campaignId,
        campaign_product_id:
          campaignProductId,
      },
    },
  }
}

export async function getEqualAllocationPreview(
  campaignId: string,
  campaignProductId: string
): Promise<EqualAllocationPreview> {
  const campaignProduct =
    await findCampaignProduct(
      prisma,
      campaignId,
      campaignProductId
    )

  if (!campaignProduct) {
    throw new Error(
      "Campaign product not found."
    )
  }

  const {
    contributedQuantity,
    allocatedQuantity,
    availableQuantity,
  } = await getQuantityBalance(
    prisma,
    campaignId,
    campaignProduct
  )

  const eligibleParticipantCount =
    await prisma.participants.count({
      where: eligibleParticipantsWhere(
        campaignId,
        campaignProduct.id
      ),
    })

  const {
    quantityPerParticipant,
    remainderQuantity,
  } = splitEqually(
    availableQuantity,
    eligibleParticipantCount
  )

  return {
    contributedQuantity,
    allocatedQuantity,
    availableQuantity,
    eligibleParticipantCount,
    quantityPerParticipant,
    remainderQuantity,
  }
}

export async function createEqualAllocations(
  campaignId: string,
  campaignProductId: string
): Promise<EqualAllocationResult> {
  // Serializable isolation keeps two concurrent runs from both deciding
  // that the same participant is still unallocated.
  return prisma.$transaction(
    async (tx) => {
      const campaignProduct =
        await findCampaignProduct(
          tx,
          campaignId,
          campaignProductId
        )

      if (!campaignProduct) {
        throw new Error(
          "Campaign product not found."
        )
      }

      const {
        contributedQuantity,
        allocatedQuantity,
        availableQuantity,
      } = await getQuantityBalance(
        tx,
        campaignId,
        campaignProduct
      )

      const eligibleParticipants =
        await tx.participants.findMany({
          where: eligibleParticipantsWhere(
            campaignId,
            campaignProduct.id
          ),
          select: {
            id: true,
          },
          orderBy: {
            registered_at: "asc",
          },
        })

      const eligibleParticipantCount =
        eligibleParticipants.length

      if (eligibleParticipantCount === 0) {
        throw new Error(
          "No eligible participants found."
        )
      }

      const {
        quantityPerParticipant,
        remainderQuantity,
      } = splitEqually(
        availableQuantity,
        eligibleParticipantCount
      )

      if (quantityPerParticipant <= 0) {
        throw new Error(
          "There is not enough available product to allocate at least one unit to each eligible participant."
        )
      }

      await tx.allocations.createMany({
        data: eligibleParticipants.map(
          (participant) => ({
            participant_id: participant.id,
            campaign_id: campaignId,
            campaign_product_id:
              campaignProduct.id,
            quantity: quantityPerParticipant,
            status: "PROPOSED" as const,
          })
        ),
      })

      await tx.participants.updateMany({
        where: {
          id: {
            in: eligibleParticipants.map(
              (participant) => participant.id
            ),
          },
        },
        data: {
          status: "ALLOCATED",
        },
      })

      return {
        contributedQuantity,
        allocatedQuantity,
        availableQuantity,
        eligibleParticipantCount,
        quantityPerParticipant,
        remainderQuantity,
        createdCount:
          eligibleParticipants.length,
      }
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 30000,
    }
  )
}
