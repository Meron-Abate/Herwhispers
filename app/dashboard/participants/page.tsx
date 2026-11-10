import { prisma } from "@/lib/prisma"
import Link from "next/link"
import PageHeader from "@/app/dashboard/PageHeader"
import StatusBadge from "@/app/dashboard/StatusBadge"

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function ParticipantsPage() {
  const participants = await prisma.participants.findMany({
    include: {
      students: {
        include: {
          universities: true,
        },
      },
      campaigns: true,
    },
    orderBy: {
      registered_at: "desc",
    },
  })

  const verified = participants.filter(
    (participant) => participant.status === "VERIFIED"
  ).length

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Participants"
          description="Manage campaign participants"
        />

        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-900">
              {participants.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Verified</p>
            <p className="text-xl font-bold text-emerald-600">{verified}</p>
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
                University
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Campaign
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {participants.map((participant) => {
              const student = participant.students
              const fullName = [student.first_name, student.last_name]
                .filter(Boolean)
                .join(" ")

              return (
                <tr
                  key={participant.id}
                  className="transition hover:bg-violet-50/40"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {fullName ? initialsOf(fullName) : "•"}
                      </span>

                      <div>
                        <Link
                          href={`/dashboard/participants/${participant.id}`}
                          className="font-mono text-sm font-semibold text-slate-900 hover:text-violet-700 hover:underline"
                        >
                          {participant.participant_code}
                        </Link>

                        <p className="text-xs text-slate-500">
                          {fullName || "Name not provided"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-700">
                    {student.universities?.name ?? (
                      <span className="text-slate-400">Not assigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-700">
                    {participant.campaigns.name}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={participant.status} />
                  </td>
                </tr>
              )
            })}

            {participants.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No participants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
