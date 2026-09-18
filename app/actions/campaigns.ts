"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const assessmentId = String(formData.get("assessment_id") ?? "").trim()

  const registrationStartValue = String(
    formData.get("registration_start") ?? ""
  )

  const registrationEndValue = String(
    formData.get("registration_end") ?? ""
  )

  const distributionDateValue = String(
    formData.get("distribution_date") ?? ""
  )

  if (!name) {
    throw new Error("Campaign name is required.")
  }

  if (!assessmentId) {
    throw new Error("Assessment is required.")
  }

  if (!registrationStartValue) {
    throw new Error("Registration start is required.")
  }

  if (!registrationEndValue) {
    throw new Error("Registration end is required.")
  }

  const registrationStart = new Date(registrationStartValue)
  const registrationEnd = new Date(registrationEndValue)

  if (Number.isNaN(registrationStart.getTime())) {
    throw new Error("Invalid registration start date.")
  }

  if (Number.isNaN(registrationEnd.getTime())) {
    throw new Error("Invalid registration end date.")
  }

  if (registrationEnd <= registrationStart) {
    throw new Error(
      "Registration end must be after registration start."
    )
  }

  let distributionDate: Date | null = null

  if (distributionDateValue) {
    distributionDate = new Date(distributionDateValue)

    if (Number.isNaN(distributionDate.getTime())) {
      throw new Error("Invalid distribution date.")
    }
  }

  const now = new Date()

  const activeCampaign = await prisma.campaigns.findFirst({
    where: {
      status: "ACTIVE",
    },
  })

  let status: "DRAFT" | "UPCOMING" | "ACTIVE"

  if (
    !activeCampaign &&
    registrationStart <= now &&
    registrationEnd >= now
  ) {
    status = "ACTIVE"
  } else if (registrationStart > now) {
    status = "UPCOMING"
  } else {
    status = "DRAFT"
  }

  await prisma.campaigns.create({
    data: {
      name,
      description: description || null,
      assessment_id: assessmentId,
      registration_start: registrationStart,
      registration_end: registrationEnd,
      distribution_date: distributionDate,
      status,
    },
  })

  revalidatePath("/dashboard/campaigns")
  revalidatePath("/dashboard")
}


export async function completeCampaign(formData: FormData) {
  const campaignId = String(
    formData.get("campaignId") ?? ""
  ).trim()

  if (!campaignId) {
    throw new Error("Campaign ID is required.")
  }

  const campaign = await prisma.campaigns.findUnique({
    where: {
      id: campaignId,
    },
  })

  if (!campaign) {
    throw new Error("Campaign not found.")
  }

  if (campaign.status === "COMPLETED") {
    return
  }

  await prisma.campaigns.update({
    where: {
      id: campaignId,
    },
    data: {
      status: "COMPLETED",
      updated_at: new Date(),
    },
  })

  const now = new Date()

  /*
   * Find the next campaign whose registration
   * period is currently open.
   */
  const nextCampaign = await prisma.campaigns.findFirst({
    where: {
      id: {
        not: campaignId,
      },

      status: {
        in: ["UPCOMING", "DRAFT"],
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

  if (nextCampaign) {
    await prisma.campaigns.update({
      where: {
        id: nextCampaign.id,
      },

      data: {
        status: "ACTIVE",
        updated_at: new Date(),
      },
    })
  }

  revalidatePath("/dashboard/campaigns")
  revalidatePath("/dashboard")

    redirect("/dashboard/campaigns")
}