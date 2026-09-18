import { prisma } from "@/lib/prisma"
import Link from "next/link"

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Participants
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage campaign participants
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Participant Code
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Student
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                University
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Campaign
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="px-6 py-4 text-sm font-medium">
                  <Link
    href={`/dashboard/participants/${participant.id}`}
    className="underline"
  >
                      {participant.participant_code}

  </Link>
                </td>

                <td className="px-6 py-4 text-sm">
                  {participant.students.first_name}{" "}
                  {participant.students.last_name}
                </td>

                <td className="px-6 py-4 text-sm">
                  {participant.students.universities?.name ?? "—"}
                </td>

                <td className="px-6 py-4 text-sm">
                  {participant.campaigns.name}
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    {participant.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}