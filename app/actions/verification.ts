"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type VerificationResult = {
  success: boolean
  message?: string
  participant?: {
    id: string
    participant_code: string
    status: string
    registered_at: Date
    student: {
      id: string
      telegram_id: string
      first_name: string | null
      last_name: string | null
    }
    campaign: {
      id: string
      name: string
      status: string
    }
    qrCode: {
      id: string
      qr_token: string
      issued_at: Date
      revoked_at: Date | null
    } | null
    assessment: {
      id: string
      total_score: number
      result: string | null
      result_reason: string | null
      submitted_at: Date | null
    } | null
    allocations: Array<{
      id: string
      quantity: number
      status: string
      productName: string
    }>
    distributions: Array<{
      id: string
      quantity: number
      status: string
      distributed_at: Date
    }>
  }
}

export async function verifyTokenOrCode(
  input: string
): Promise<VerificationResult> {
  let query = input.trim()

  if (!query) {
    return {
      success: false,
      message: "Please enter a QR token or Participant Code.",
    }
  }

  // Handle scanned URLs (e.g. https://.../?token=XYZ or ?code=HW-...)
  if (query.startsWith("http://") || query.startsWith("https://")) {
    try {
      const url = new URL(query)
      const tokenParam =
        url.searchParams.get("token") || url.searchParams.get("qr_token")
      const codeParam =
        url.searchParams.get("code") || url.searchParams.get("participant_code")
      if (tokenParam) {
        query = tokenParam.trim()
      } else if (codeParam) {
        query = codeParam.trim()
      }
    } catch {
      // Ignore URL parsing errors and fallback to raw string
    }
  }

  // 1. First attempt: check if input matches a QR token
  let qrRecord = await prisma.qr_codes.findUnique({
    where: {
      qr_token: query,
    },
    include: {
      participants: {
        include: {
          students: true,
          campaigns: true,
          qr_codes: true,
          assessment_attempts: true,
          allocations: {
            include: {
              campaign_products: {
                include: {
                  products: true,
                },
              },
            },
          },
          distributions: {
            orderBy: {
              distributed_at: "desc",
            },
          },
        },
      },
    },
  })

  let participant: any = qrRecord?.participants

  // 2. Second attempt: check if input matches a Participant Code (e.g. HW-2026-...)
  if (!participant) {
    participant = await prisma.participants.findUnique({
      where: {
        participant_code: query.toUpperCase(),
      },
      include: {
        students: true,
        campaigns: true,
        qr_codes: true,
        assessment_attempts: true,
        allocations: {
          include: {
            campaign_products: {
              include: {
                products: true,
              },
            },
          },
        },
        distributions: {
          orderBy: {
            distributed_at: "desc",
          },
        },
      },
    })

    if (participant?.qr_codes) {
      qrRecord = participant.qr_codes as any
    }
  }

  if (!participant) {
    return {
      success: false,
      message: "No participant found matching this QR code or Participant Code.",
    }
  }

  return {
    success: true,
    participant: {
      id: participant.id,
      participant_code: participant.participant_code,
      status: participant.status,
      registered_at: participant.registered_at,
      student: {
        id: participant.students.id,
        telegram_id: participant.students.telegram_id.toString(),
        first_name: participant.students.first_name,
        last_name: participant.students.last_name,
      },
      campaign: {
        id: participant.campaigns.id,
        name: participant.campaigns.name,
        status: participant.campaigns.status,
      },
      qrCode: qrRecord
        ? {
            id: qrRecord.id,
            qr_token: qrRecord.qr_token,
            issued_at: qrRecord.issued_at,
            revoked_at: qrRecord.revoked_at,
          }
        : null,
      assessment: participant.assessment_attempts
        ? {
            id: participant.assessment_attempts.id,
            total_score: participant.assessment_attempts.total_score,
            result: participant.assessment_attempts.result,
            result_reason: participant.assessment_attempts.result_reason,
            submitted_at: participant.assessment_attempts.submitted_at,
          }
        : null,
      allocations: participant.allocations.map((a: any) => ({
        id: a.id,
        quantity: a.quantity,
        status: a.status,
        productName:
          a.campaign_products?.products?.name ?? "Menstrual Support Kit",
      })),
      distributions: participant.distributions.map((d: any) => ({
        id: d.id,
        quantity: d.quantity,
        status: d.status,
        distributed_at: d.distributed_at,
      })),
    },
  }
}

export async function confirmHandover(
  participantId: string,
  quantityToDistribute: number = 2
) {
  const participant = await prisma.participants.findUnique({
    where: { id: participantId },
    include: {
      distributions: true,
      allocations: true,
      campaigns: true,
    },
  })

  if (!participant) {
    throw new Error("Participant not found.")
  }

  if (participant.distributions.length > 0) {
    throw new Error(
      "Products have already been distributed to this participant for this campaign."
    )
  }

  // Check if an allocation already exists for this participant
  let allocation = participant.allocations[0]

  if (!allocation) {
    // Look up or find a campaign product
    let campaignProduct = await prisma.campaign_products.findFirst({
      where: { campaign_id: participant.campaign_id },
    })

    if (!campaignProduct) {
      // Find a default product
      let defaultProduct = await prisma.products.findFirst()
      if (!defaultProduct) {
        defaultProduct = await prisma.products.create({
          data: {
            name: "Sanitary Pads Pack",
            unit: "pack",
          },
        })
      }

      campaignProduct = await prisma.campaign_products.create({
        data: {
          campaign_id: participant.campaign_id,
          product_id: defaultProduct.id,
        },
      })
    }

    allocation = await prisma.allocations.create({
      data: {
        participant_id: participant.id,
        campaign_id: participant.campaign_id,
        campaign_product_id: campaignProduct.id,
        quantity: quantityToDistribute,
        status: "CONFIRMED",
        confirmed_at: new Date(),
      },
    })
  }

  // Create the distribution record
  const distribution = await prisma.distributions.create({
    data: {
      allocation_id: allocation.id,
      campaign_id: participant.campaign_id,
      participant_id: participant.id,
      quantity: quantityToDistribute,
      status: "COMPLETED",
      distributed_at: new Date(),
    },
  })

  // Update participant status to SUPPORTED
  await prisma.participants.update({
    where: { id: participant.id },
    data: {
      status: "SUPPORTED",
    },
  })

  revalidatePath("/dashboard/Verification")
  revalidatePath("/dashboard/distributions")
  revalidatePath("/dashboard")

  return {
    success: true,
    distribution,
  }
}
