import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const [
    participants,
    verified,
    students,
    universities,
    campaigns,
  ] = await Promise.all([
    prisma.participants.count(),

    prisma.participants.count({
      where: {
        status: "VERIFIED",
      },
    }),

    prisma.students.count(),

    prisma.universities.count(),

    prisma.campaigns.count(),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        HerWhispers Dashboard
      </h1>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Participants
          </p>

          <p className="mt-2 text-3xl font-bold">
            {participants}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Verified
          </p>

          <p className="mt-2 text-3xl font-bold">
            {verified}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Students
          </p>

          <p className="mt-2 text-3xl font-bold">
            {students}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Universities
          </p>

          <p className="mt-2 text-3xl font-bold">
            {universities}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Campaigns
          </p>

          <p className="mt-2 text-3xl font-bold">
            {campaigns}
          </p>
        </div>
      </div>
    </div>
  )
}