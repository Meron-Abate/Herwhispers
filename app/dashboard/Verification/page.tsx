import { prisma } from "@/lib/prisma"

export default async function VerificationPage() {
  const participants = await prisma.participants.findMany({
    include: {
      students: true,
      campaigns: true,
      qr_codes: true,
    },
    orderBy: {
      registered_at: "desc",
    },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Verification
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Verify campaign participants
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {participant.participant_code}
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                {participant.status}
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              {participant.students.first_name}{" "}
              {participant.students.last_name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {participant.campaigns.name}
            </p>

            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-gray-500">
                QR Records
              </p>

              <p className="mt-1 text-lg font-semibold">
                {participant.qr_codes.length}
              </p>
            </div>
          </div>
        ))}

        {participants.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
            No participants found.
          </div>
        )}
      </div>
    </div>
  )
}