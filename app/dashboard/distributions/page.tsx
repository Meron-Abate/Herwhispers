import { prisma } from "@/lib/prisma"

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Distributions
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Track product distributions
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Participant
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Student
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Campaign
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Quantity
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {distributions.map((distribution) => (
              <tr key={distribution.id}>
                <td className="px-6 py-4 text-sm font-medium">
                  {distribution.participants?.participant_code}
                </td>

                <td className="px-6 py-4 text-sm">
                  {distribution.participants?.students?.first_name}{" "}
                  {distribution.participants?.students?.last_name}
                </td>

                <td className="px-6 py-4 text-sm">
                  {distribution.participants?.campaigns?.name}
                </td>

                <td className="px-6 py-4 text-sm">
                  {distribution.quantity ?? "—"}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    {distribution.status ?? "—"}
                  </span>
                </td>
              </tr>
            ))}

            {distributions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500"
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