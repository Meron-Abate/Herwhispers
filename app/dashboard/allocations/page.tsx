import { prisma } from "@/lib/prisma"

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

  const proposedCount = allocations.filter(
    (allocation) =>
      allocation.status === "PROPOSED"
  ).length

  const confirmedCount = allocations.filter(
    (allocation) =>
      allocation.status === "CONFIRMED"
  ).length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

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

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Product Allocations
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
            Review and manage product quantities allocated to eligible
            HerWhispers participants.
          </p>
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
              <table className="w-full min-w-[950px] text-left">

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

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              allocation
                                .campaign_products
                                .products
                                .unit
                            }
                          </p>
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