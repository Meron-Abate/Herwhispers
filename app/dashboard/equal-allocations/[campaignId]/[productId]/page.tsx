import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEqualAllocationPreview } from "@/lib/allocations"
import { triggerEqualAllocation } from "@/app/actions/allocations"

export const dynamic = "force-dynamic"

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

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
  })

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

  const preview = await getEqualAllocationPreview(
    campaignId,
    campaignProduct.id
  )

  const canAllocate =
    preview.quantityPerParticipant > 0 &&
    preview.eligibleParticipantCount > 0

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
          <h2 className="text-xl font-semibold text-gray-900">
            Equal Allocation
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Campaign: {campaign.name}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Product: {product.name}
            {product.unit ? ` (${product.unit})` : ""}
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Every eligible participant receives the same quantity. Any
            remainder stays unallocated; no participant is prioritised.
          </p>
        </div>

        <div className="grid gap-4 border-b p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Delivered contributions
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {preview.contributedQuantity}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Already allocated
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {preview.allocatedQuantity}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Available
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {preview.availableQuantity}
            </p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500">
            Eligible participants:{" "}
            {preview.eligibleParticipantCount}
          </p>

          {preview.availableQuantity === 0 && (
            <div className="mt-4 rounded-lg bg-gray-100 p-4 text-gray-700">
              <p className="font-medium">
                No available quantity
              </p>
              <p className="mt-1 text-sm text-gray-600">
                There are no delivered partner contributions left to
                allocate for this product.
              </p>
            </div>
          )}

          {preview.availableQuantity > 0 &&
            preview.eligibleParticipantCount === 0 && (
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-gray-700">
                <p className="font-medium">
                  No eligible participants
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Every eligible participant already has an allocation
                  for this product.
                </p>
              </div>
            )}

          {canAllocate && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Each participant will receive{" "}
                <span className="font-bold text-gray-900">
                  {preview.quantityPerParticipant}
                </span>
                {product.unit ? ` ${product.unit}` : " unit(s)"}.
              </p>

              {preview.remainderQuantity > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {preview.remainderQuantity} unit(s) cannot be divided
                  equally and will remain unallocated.
                </p>
              )}
            </div>
          )}

          {preview.availableQuantity > 0 &&
            preview.eligibleParticipantCount > 0 &&
            preview.quantityPerParticipant === 0 && (
              <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-800">
                <p className="font-medium">
                  Not enough quantity for equal allocation
                </p>
                <p className="mt-1 text-sm text-red-600">
                  Each of the {preview.eligibleParticipantCount} eligible
                  participants would receive 0 units, but the rule
                  requires at least 1 unit each.
                </p>
              </div>
            )}

          {canAllocate && (
            <form
              action={triggerEqualAllocation.bind(
                null,
                campaignId,
                campaignProduct.id
              )}
              className="mt-6"
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Allocate Equally Among{" "}
                {preview.eligibleParticipantCount} Participants
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
