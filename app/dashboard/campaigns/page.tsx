import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { completeCampaign } from "@/app/actions/campaigns"

export default async function CampaignsPage() {
  const campaigns = await prisma.campaigns.findMany({
    include: {
      assessments: true,
      participants: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Campaigns
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage HerWhispers support campaigns.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New Campaign
        </Link>
      </div>

      {/* Campaign table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Campaign
              </th>

              <th className="px-6 py-4 font-semibold text-gray-700">
                Assessment
              </th>

              <th className="px-6 py-4 font-semibold text-gray-700">
                Registration
              </th>

              <th className="px-6 py-4 font-semibold text-gray-700">
                Participants
              </th>

              <th className="px-6 py-4 font-semibold text-gray-700">
                Status
              </th>

              <th className="px-6 py-4 font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                {/* Campaign */}
                <td className="px-6 py-5">
                  <div className="font-medium text-gray-900">
                    {campaign.name}
                  </div>

                  {campaign.description && (
                    <div className="mt-1 max-w-xs text-xs text-gray-500">
                      {campaign.description}
                    </div>
                  )}
                </td>

                {/* Assessment */}
                <td className="px-6 py-5 text-gray-600">
                  {campaign.assessments.title}
                </td>

                {/* Registration */}
                <td className="px-6 py-5 text-gray-600">
                  <div>
                    {campaign.registration_start.toLocaleString()}
                  </div>

                  <div className="my-1 text-xs text-gray-400">
                    to
                  </div>

                  <div>
                    {campaign.registration_end.toLocaleString()}
                  </div>
                </td>

                {/* Participants */}
                <td className="px-6 py-5 text-gray-600">
                  {campaign.participants.length}
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      campaign.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "COMPLETED"
                        ? "bg-gray-100 text-gray-700"
                        : campaign.status === "UPCOMING"
                        ? "bg-blue-100 text-blue-700"
                        : campaign.status === "PAUSED"
                        ? "bg-yellow-100 text-yellow-700"
                        : campaign.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>

                {/* Action */}
                <td className="px-6 py-5">
                  {campaign.status === "ACTIVE" ? (
                    <form action={completeCampaign}>
                      <input
                        type="hidden"
                        name="campaignId"
                        value={campaign.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Complete
                      </button>
                    </form>
                  ) : (
                    <span className="text-sm text-gray-400">
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No campaigns found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}