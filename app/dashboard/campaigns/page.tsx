import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { completeCampaign } from "@/app/actions/campaigns"

const statusStyles: Record<string, string> = {
DRAFT: "bg-gray-100 text-gray-700",
UPCOMING: "bg-blue-100 text-blue-700",
ACTIVE: "bg-green-100 text-green-700",
PAUSED: "bg-yellow-100 text-yellow-700",
REGISTRATION_CLOSED: "bg-orange-100 text-orange-700",
DISTRIBUTION: "bg-purple-100 text-purple-700",
COMPLETED: "bg-gray-200 text-gray-800",
CANCELLED: "bg-red-100 text-red-700",
}

function formatDate(date: Date | null) {
return date ? date.toLocaleString() : "Not scheduled"
}

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
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage HerWhispers support campaigns.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          className="w-fit rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New Campaign
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Campaign</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Assessment</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Registration</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Distribution Date</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Participants</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-5">
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  <div className="mt-1 max-w-xs text-xs text-gray-500">
                    {campaign.description || "No description provided"}
                  </div>
                </td>

                <td className="px-6 py-5 text-gray-600">
                  {campaign.assessments.title}
                </td>

                <td className="px-6 py-5 text-gray-600">
                  <div>
                    <span className="font-medium">Start: </span>
                    {formatDate(campaign.registration_start)}
                  </div>
                  <div className="mt-2">
                    <span className="font-medium">End: </span>
                    {formatDate(campaign.registration_end)}
                  </div>
                </td>

                <td className="px-6 py-5 text-gray-600">
                  {formatDate(campaign.distribution_date)}
                </td>

                <td className="px-6 py-5 text-gray-600">
                  {campaign.participants.length}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[campaign.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {campaign.status.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="px-6 py-5">
                  {campaign.status === "ACTIVE" ? (
                    <form action={completeCampaign}>
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Complete
                      </button>
                    </form>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="font-medium text-gray-900">No campaigns found</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a campaign to see it listed here.
                  </p>
                  <Link
                    href="/dashboard/campaigns/new"
                    className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Create Campaign
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
