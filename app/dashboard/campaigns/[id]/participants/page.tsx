import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export default async function CampaignParticipantsPage({
  params,
}: PageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const campaign =
    await prisma.campaigns.findUnique({
      where: {
        id,
      },
      include: {
        participants: {
          include: {
            students: {
              include: {
                universities: true,
              },
            },
          },
          orderBy: {
            registered_at: "desc",
          },
        },
      },
    })

  if (!campaign) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">

        {/* Back */}
        <Link
          href="/dashboard/campaigns"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>

          Back to Campaigns
        </Link>

        {/* Header */}
        <div className="mt-6">

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              CAMPAIGN PARTICIPANTS
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Participant Management
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {campaign.name}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Manage students who qualified for this campaign.
          </p>

        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Participants
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {campaign.participants.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Allocated
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                campaign.participants.filter(
                  (participant) =>
                    participant.status ===
                    "ALLOCATED"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Supported
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                campaign.participants.filter(
                  (participant) =>
                    participant.status ===
                    "SUPPORTED"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Participants
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Students who qualified for this campaign.
            </p>
          </div>

          {campaign.participants.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                ○
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                No participants yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Eligible students will appear here after completing
                the assessment.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Participant
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      University
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Registered
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {campaign.participants.map(
                    (participant) => (
                      <tr
                        key={participant.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-bold text-slate-800">
                            {participant.participant_code}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {participant.students.first_name}{" "}
                            {participant.students.last_name}
                          </p>

                          {participant.students
                            .telegram_username && (
                            <p className="mt-1 text-xs text-slate-400">
                              @
                              {
                                participant.students
                                  .telegram_username
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {participant.students.universities
                            ?.name ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          {participant.status ===
                          "SUPPORTED" ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              SUPPORTED
                            </span>
                          ) : participant.status ===
                            "ALLOCATED" ? (
                            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                              ALLOCATED
                            </span>
                          ) : participant.status ===
                            "CANCELLED" ? (
                            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                              CANCELLED
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                              VERIFIED
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {participant.registered_at.toLocaleDateString()}
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