import { prisma } from "@/lib/prisma"
import PageHeader from "@/app/dashboard/PageHeader"
import StatusBadge from "@/app/dashboard/StatusBadge"

export default async function DistributionsPage() {
  const distributions = await prisma.distributions.findMany({
    include: {
      participants: {
        include: {
          students: true,
          campaigns: true,
        },
      },
    },
    orderBy: {
      distributed_at: "desc",
    },
  })

  const totalQuantity = distributions.reduce(
    (sum, distribution) => sum + (distribution.quantity ?? 0),
    0
  )

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Distributions"
          description="Track product distributions"
        />

        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Records</p>
            <p className="text-xl font-bold text-slate-900">
              {distributions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Products given
            </p>
            <p className="text-xl font-bold text-violet-600">
              {totalQuantity}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participant
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Campaign
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quantity
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {distributions.map((distribution) => {
              const student = distribution.participants?.students
              const fullName = [student?.first_name, student?.last_name]
                .filter(Boolean)
                .join(" ")

              return (
                <tr
                  key={distribution.id}
                  className="transition hover:bg-violet-50/40"
                >
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {distribution.participants?.participant_code ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fullName || "Name not provided"}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-700">
                    {distribution.participants?.campaigns?.name ?? "—"}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {distribution.quantity ?? "—"}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={distribution.status} />
                  </td>
                </tr>
              )
            })}

            {distributions.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No distributions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
