import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import StatusBadge from "@/app/dashboard/StatusBadge"
import CategoryBadge from "@/app/dashboard/CategoryBadge"

type ParticipantDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-900">
        {children ?? <span className="text-slate-400">—</span>}
      </div>
    </div>
  )
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

export default async function ParticipantDetailPage({
  params,
}: ParticipantDetailPageProps) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const participant = await prisma.participants.findUnique({
    where: { id },
    include: {
      students: { include: { universities: true } },
      campaigns: true,
      assessment_attempts: { include: { assessments: true } },
      qr_codes: true,
      allocations: {
        include: { campaign_products: { include: { products: true } } },
        orderBy: { created_at: "desc" },
      },
      distributions: { orderBy: { distributed_at: "desc" } },
    },
  })

  if (!participant) {
    notFound()
  }

  const student = participant.students
  const attempt = participant.assessment_attempts
  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
    "Name not provided"

  return (
    <div className="p-8">
      <Link
        href="/dashboard/participants"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to Participants
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900">
            {participant.participant_code}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {fullName} · {participant.campaigns.name}
          </p>
        </div>

        <StatusBadge status={participant.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Student">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Link
                href={`/dashboard/students/${student.id}`}
                className="font-medium text-violet-700 hover:underline"
              >
                {fullName}
              </Link>
            </Field>
            <Field label="Telegram username">
              {student.telegram_username
                ? `@${student.telegram_username}`
                : null}
            </Field>
            <Field label="Telegram ID">{String(student.telegram_id)}</Field>
            <Field label="Phone">{student.phone}</Field>
            <Field label="University">{student.universities?.name}</Field>
          </div>
        </Card>

        <Card title="Registration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign">{participant.campaigns.name}</Field>
            <Field label="Registered">
              {participant.registered_at.toLocaleDateString(
                "en-GB",
                dateFormat
              )}
            </Field>
            <Field label="QR code">
              {participant.qr_codes ? (
                <StatusBadge status="ISSUED" tone="success" />
              ) : (
                <StatusBadge status="NOT ISSUED" tone="neutral" />
              )}
            </Field>
            <Field label="Distributed">
              {participant.distributions.length > 0 ? "Yes" : "Not yet"}
            </Field>
          </div>
        </Card>

        <Card title="Assessment">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assessment">{attempt.assessments.title}</Field>
            <Field label="Result">
              <StatusBadge status={attempt.result ?? "PENDING"} />
            </Field>
            <Field label="Score">{String(attempt.total_score)}</Field>
            <Field label="Submitted">
              {attempt.submitted_at
                ? attempt.submitted_at.toLocaleDateString("en-GB", dateFormat)
                : null}
            </Field>
          </div>

          {attempt.result_reason && (
            <p className="mt-4 text-sm text-slate-500">
              {attempt.result_reason}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Allocations</h2>
        </div>

        {participant.allocations.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No products allocated yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {participant.allocations.map((allocation) => (
                <tr key={allocation.id}>
                  <td className="px-6 py-3 text-slate-900">
                    <div className="flex flex-wrap items-center gap-2">
                      {allocation.campaign_products.products.name}
                      <CategoryBadge
                        category={allocation.campaign_products.products.category}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">
                    {allocation.quantity}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={allocation.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {allocation.confirmed_at
                      ? allocation.confirmed_at.toLocaleDateString(
                          "en-GB",
                          dateFormat
                        )
                      : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Distributions
          </h2>
        </div>

        {participant.distributions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            Nothing has been handed out yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {participant.distributions.map((distribution) => (
                <tr key={distribution.id}>
                  <td className="px-6 py-3 font-semibold text-slate-900">
                    {distribution.quantity}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={distribution.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {distribution.distributed_at.toLocaleDateString(
                      "en-GB",
                      dateFormat
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
