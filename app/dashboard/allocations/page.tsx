import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { approveAllocation } from "@/app/actions/allocations"
import CategoryBadge from "@/app/dashboard/CategoryBadge"
import { getInventory } from "@/lib/inventory"
import AssignStockForm from "@/app/dashboard/Products/AssignStockForm"
import AssignmentRow from "@/app/dashboard/Products/AssignmentRow"

export const dynamic = "force-dynamic"

export default async function AllocationsPage() {
  const allocations =
    await prisma.allocations.findMany({
      include: {
        participants: {
          include: {
            students: true,
          },
        },
        campaigns: true,
        campaign_products: {
          include: {
            products: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

  const [{ categories, assignments }, campaigns] = await Promise.all([
    getInventory(),
    prisma.campaigns.findMany({
      select: { id: true, name: true },
      orderBy: { created_at: "desc" },
    }),
  ])

  const unassigned = Object.fromEntries(
    categories.map((stock) => [stock.category, stock.unassigned])
  ) as Record<
    "DISPOSABLE_PAD" | "REUSABLE_PAD" | "TAMPON" | "OTHER",
    number
  >

  const proposedCount = allocations.filter(
    (allocation) =>
      allocation.status === "PROPOSED"
  ).length

  const confirmedCount = allocations.filter(
    (allocation) =>
      allocation.status === "CONFIRMED"
  ).length

  return (
    <div>
      <div className="p-8">

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              ALLOCATIONS
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product Distribution Management
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Product Allocations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Review and manage product quantities allocated to eligible
                HerWhispers participants.
              </p>
            </div>

            <Link
              href="/dashboard/equal-allocations"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <span aria-hidden="true">+</span>
              New allocation
            </Link>
          </div>
        </div>

        {/* Step 1: give a campaign its share of the inventory */}
        <div className="mt-8">
          <AssignStockForm campaigns={campaigns} unassigned={unassigned} />

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Stock assigned to campaigns
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                You can't assign more than the inventory holds. Change a
                number and press Save to adjust a campaign's share.
              </p>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  {["Campaign", "Category", "Assigned", "Given to participants", "Left"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignments.map((row) => (
                  <tr
                    key={row.campaignProductId}
                    className="transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.campaignName}
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={row.category} />
                    </td>
                    <td className="px-6 py-4">
                      <AssignmentRow
                        campaignProductId={row.campaignProductId}
                        assigned={row.assigned}
                        allocated={row.allocated}
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.allocated}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {Math.max(row.assigned - row.allocated, 0)}
                    </td>
                  </tr>
                ))}

                {assignments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No campaign has been given any stock yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Allocations
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {allocations.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All allocation records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Proposed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {proposedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Awaiting confirmation
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Confirmed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {confirmedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ready for distribution
            </p>
          </div>

        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Allocation Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products assigned to eligible participants.
            </p>
          </div>

          {allocations.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400">
                ○
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                No allocations yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Allocations will appear here once products are assigned
                to eligible participants.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Participant
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Campaign
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Product
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Quantity
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Created
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confirmed
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {allocations.map(
                    (allocation) => (
                      <tr
                        key={allocation.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* Participant */}
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-bold text-slate-800">
                            {
                              allocation
                                .participants
                                .participant_code
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              allocation
                                .participants
                                .students
                                .first_name
                            }{" "}
                            {
                              allocation
                                .participants
                                .students
                                .last_name
                            }
                          </p>
                        </td>

                        {/* Campaign */}
                        <td className="px-6 py-4">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-slate-700">
                            {allocation.campaigns.name}
                          </p>
                        </td>

                        {/* Product */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {
                              allocation
                                .campaign_products
                                .products
                                .name
                            }
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <CategoryBadge
                              category={
                                allocation.campaign_products.products
                                  .category
                              }
                            />
                            <span className="text-xs text-slate-400">
                              {
                                allocation
                                  .campaign_products
                                  .products
                                  .unit
                              }
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                            {allocation.quantity}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {allocation.status ===
                          "CONFIRMED" ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              CONFIRMED
                            </span>
                          ) : allocation.status ===
                            "CANCELLED" ? (
                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
                              CANCELLED
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                              PROPOSED
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {allocation.created_at.toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {allocation.confirmed_at
                            ? allocation.confirmed_at.toLocaleDateString()
                            : "Pending"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/allocations/${allocation.id}`}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              View
                            </Link>

                            {allocation.status ===
                              "PROPOSED" && (
                              <form
                                action={approveAllocation.bind(
                                  null,
                                  allocation.id
                                )}
                              >
                                <button
                                  type="submit"
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              </form>
                            )}
                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}