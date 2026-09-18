import { prisma } from "@/lib/prisma"

export async function syncCampaignStatuses() {
  const now = new Date()

  /*
   * 1. Find currently active campaigns
   *    whose registration period has ended.
   */

  const expiredCampaigns =
    await prisma.campaigns.findMany({
      where: {
        status: "ACTIVE",

        registration_end: {
          lt: now,
        },
      },
    })

  /*
   * 2. Complete expired campaigns.
   */

  for (
    const campaign of expiredCampaigns
  ) {
    await prisma.campaigns.update({
      where: {
        id: campaign.id,
      },

      data: {
        status: "COMPLETED",
        updated_at: new Date(),
      },
    })
  }


  /*
   * 3. Check whether an active campaign
   *    already exists.
   */

  const activeCampaign =
    await prisma.campaigns.findFirst({
      where: {
        status: "ACTIVE",
      },
    })

  if (activeCampaign) {
    return activeCampaign
  }


  /*
   * 4. Find the next scheduled campaign.
   */

  const nextCampaign =
    await prisma.campaigns.findFirst({
      where: {
        status: {
          in: [
            "UPCOMING",
            "DRAFT",
          ],
        },

        registration_start: {
          lte: now,
        },

        registration_end: {
          gte: now,
        },
      },

      orderBy: {
        registration_start: "asc",
      },
    })


  /*
   * 5. Activate it.
   */

  if (nextCampaign) {
    const activated =
      await prisma.campaigns.update({
        where: {
          id: nextCampaign.id,
        },

        data: {
          status: "ACTIVE",
          updated_at: new Date(),
        },
      })

    return activated
  }

  return null
}


export async function getActiveCampaign() {
  return syncCampaignStatuses()
}