import { prisma } from "@/lib/prisma"
import { VerificationScanner } from "./VerificationScanner"

export const dynamic = "force-dynamic"

export default async function VerificationPage() {
  const participants = await prisma.participants.findMany({
    include: {
      students: true,
      campaigns: true,
      qr_codes: true,
      distributions: true,
      assessment_attempts: true,
    },
    orderBy: {
      registered_at: "desc",
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Distribution & Eligibility Verification
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Scan student QR codes or verify participant codes to confirm eligibility and record product distribution.
        </p>
      </div>

      {/* Interactive Scanner & Lookup Form */}
      <VerificationScanner />

      {/* Registered Participants Directory */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Registered Participants ({participants.length})
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          List of all registered participants across campaigns.
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((participant) => {
            const isDistributed = participant.distributions.length > 0
            const isEligible = participant.assessment_attempts?.result === "ELIGIBLE"

            return (
              <div
                key={participant.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 font-mono">
                      {participant.participant_code}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isEligible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {participant.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    Telegram ID: <span className="font-mono text-xs">{participant.students.telegram_id.toString()}</span>
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Campaign: <span className="font-medium text-gray-700">{participant.campaigns.name}</span>
                  </p>

                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Assessment Score: </span>
                    <span className="text-xs font-bold text-gray-800">
                      {participant.assessment_attempts?.total_score ?? "N/A"} pts
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block">QR Code:</span>
                    <span className="font-medium text-gray-700">
                      {participant.qr_codes ? "Issued (Active)" : "None"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Distribution:</span>
                    <span
                      className={`font-semibold ${
                        isDistributed ? "text-purple-600" : "text-amber-600"
                      }`}
                    >
                      {isDistributed ? "Collected" : "Awaiting"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {participants.length === 0 && (
            <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
              No participants found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}