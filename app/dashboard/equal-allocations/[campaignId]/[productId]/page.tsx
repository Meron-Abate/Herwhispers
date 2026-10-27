import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { triggerEqualAllocation } from "@/app/actions/allocations"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function EqualAllocationPage({
  params,
}: {
  params: Promise<{
    campaignId: string
    productId: string
  }>
}) {
  const { campaignId, productId } = await params

  if (
    !isValidUUID(campaignId) ||
    !isValidUUID(productId)
  ) {
    notFound()
  }

  // Get campaign details
  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
  })

  // Get campaign product details
  const campaignProduct =
    await prisma.campaign_products.findFirst({
      where: {
        campaign_id: campaignId,
        product_id: productId,
      },
      include: {
        products: true,
      },
    })

  if (!campaign || !campaignProduct) {
    notFound()
  }

  const product = campaignProduct.products

  // Get eligible participants (VERIFIED or ALLOCATED status, not already allocated)
  const existingAllocations =
    await prisma.allocations.findMany({
      where: {
        campaign_id: campaignId,
        campaign_product_id: campaignProduct.id,
      },
      select: {
        participant_id: true,
      },
    })

  const alreadyAllocatedIds = new Set(
    existingAllocations.map((a) => a.participant_id)
  )

  const newParticipants = await prisma.participants.findMany({
    where: {
      campaign_id: campaignId,
      status: {
        in: ["VERIFIED", "ALLOCATED"],
      },
      id: {
        notIn: Array.from(alreadyAllocatedIds),
      },
    },
    orderBy: {
      registered_at: "asc",
    },
  })

  // TODO: replace with the campaign product's real inventory balance.
  const availableQuantity = 100

  if (newParticipants.length === 0) {
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">Equal Allocation</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-lg text-gray-500">
              All eligible participants already have allocations for this product.
            </p>
            <Link
              href="/dashboard/allocations"
              className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              ← Back to Allocations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate quantity per participant using the existing function's logic
  const quantityPerParticipant = Math.floor(
    availableQuantity / newParticipants.length
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/allocations"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          ← Back to Allocations
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">Equal Allocation</h2>

          <p className="mt-1 text-sm text-gray-500">
            Campaign: {campaign.name}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Product: {product.name}{product.unit ? ` (${product.unit})` : ""}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Eligible participants: {newParticipants.length}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Available quantity for allocation: {availableQuantity}
          </p>

          {quantityPerParticipant > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Each participant will receive: {quantityPerParticipant}
              {product.unit ? ` (${product.unit})` : ""}
            </p>
          )}

          {quantityPerParticipant > 0 && (
            <form
              action={triggerEqualAllocation.bind(
                null,
                campaignId,
                productId,
                availableQuantity
              )}
              className="mt-6 space-y-6 rounded-xl border bg-white p-6 shadow-sm"
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Allocate Equally Among {newParticipants.length} Participants
              </button>
            </form>
          )}

          {quantityPerParticipant <= 0 && (
            <div className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
              <p className="font-medium text-red-800">
                Not enough quantity for equal allocation
              </p>
              <p className="text-sm text-red-600">
                Each of the {newParticipants.length} eligible participants would
                receive {quantityPerParticipant || 0} unit(s), but this is less
                than 1.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
