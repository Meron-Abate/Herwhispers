
import { createCampaign } from "../../../actions/campaigns"
import { prisma } from "@/lib/prisma"

export default async function NewCampaignPage() {
  const assessments = await prisma.assessments.findMany({
    where: {
      is_active: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })

  return (
    <div className="max-w-xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Campaign
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a new HerWhispers support campaign.
        </p>
      </div>

      <form
        action={createCampaign}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        {/* Campaign Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Campaign Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="October 2026 Menstrual Product Support"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe this campaign..."
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />
        </div>

        {/* Assessment */}
        <div>
          <label
            htmlFor="assessment_id"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Assessment
          </label>

          <select
            id="assessment_id"
            name="assessment_id"
            required
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          >
            <option value="">
              Select an assessment
            </option>

            {assessments.map((assessment) => (
              <option
                key={assessment.id}
                value={assessment.id}
              >
                {assessment.title}
              </option>
            ))}
          </select>

          {assessments.length === 0 && (
            <p className="mt-2 text-sm text-red-500">
              No active assessments are available.
            </p>
          )}
        </div>

        {/* Registration Start */}
        <div>
          <label
            htmlFor="registration_start"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Registration Start
          </label>

          <input
            id="registration_start"
            name="registration_start"
            type="datetime-local"
            required
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />
        </div>

        {/* Registration End */}
        <div>
          <label
            htmlFor="registration_end"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Registration End
          </label>

          <input
            id="registration_end"
            name="registration_end"
            type="datetime-local"
            required
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />
        </div>

        {/* Distribution Date */}
        <div>
          <label
            htmlFor="distribution_date"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Distribution Date

            <span className="ml-2 text-xs font-normal text-gray-400">
              Optional
            </span>
          </label>

          <input
            id="distribution_date"
            name="distribution_date"
            type="datetime-local"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <p className="mt-2 text-xs text-gray-500">
            You can leave this blank if the distribution date is not known yet.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={assessments.length === 0}
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Create Campaign
        </button>
      </form>
    </div>
  )
}
