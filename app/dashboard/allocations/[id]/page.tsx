import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value)
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        CONFIRMED
      </span>
    )
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
        CANCELLED
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
      PROPOSED
    </span>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd
        className={`mt-1 break-words text-sm text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  )
}

export default async function AllocationDetailPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  if (!isValidUUID(id)) {
    notFound()
  }

  const allocation = await prisma.allocations.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          students: {
            include: {
              universities: true,
            },
          },
        },
      },
      campaigns: true,
      campaign_products: {
        include: {
          products: true,
        },
      },
      distributions: true,
    },
  })

  if (!allocation) {
    notFound()
  }

  const participant = allocation.participants
  const student = participant.students
  const campaign = allocation.campaigns
  const product = allocation.campaign_products.products
  const distribution = allocation.distributions

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 lg:p-10">
        <Link
          href="/dashboard/allocations"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back to Allocations
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              ALLOCATION DETAILS
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {participant.participant_code}
            </h1>

            <p className="mt-2 font-mono text-xs text-slate-400">
              {allocation.id}
            </p>
          </div>

          <StatusBadge status={allocation.status} />
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Allocated quantity
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {allocation.quantity}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {product.unit}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status
            </p>

            <div className="mt-3">
              <StatusBadge status={allocation.status} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Created
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {formatDateTime(allocation.created_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Confirmed
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {allocation.confirmed_at
                ? formatDateTime(allocation.confirmed_at)
                : "Not confirmed yet"}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Participant */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Participant
              </h2>

              <Link
                href={`/dashboard/participants`}
                className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
              >
                View participants →
              </Link>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Participant code"
                value={participant.participant_code}
                mono
              />

              <DetailItem
                label="Participant status"
                value={participant.status}
              />

              <DetailItem
                label="Student"
                value={`${student.first_name ?? ""} ${
                  student.last_name ?? ""
                }`.trim()}
              />

              <DetailItem
                label="University"
                value={student.universities?.name ?? "—"}
              />

              <DetailItem
                label="Telegram username"
                value={
                  student.telegram_username
                    ? `@${student.telegram_username}`
                    : "—"
                }
              />

              <DetailItem
                label="Telegram ID"
                value={student.telegram_id.toString()}
                mono
              />

              <DetailItem
                label="Phone"
                value={student.phone ?? "—"}
                mono
              />

              <DetailItem
                label="Registered"
                value={formatDate(participant.registered_at)}
              />
            </dl>
          </section>

          {/* Campaign + product */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Campaign
                </h2>

                <Link
                  href="/dashboard/campaigns"
                  className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
                >
                  View campaigns →
                </Link>
              </div>

              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Name"
                  value={campaign.name}
                />

                <DetailItem
                  label="Campaign status"
                  value={campaign.status}
                />

                <DetailItem
                  label="Registration opens"
                  value={formatDate(
                    campaign.registration_start
                  )}
                />

                <DetailItem
                  label="Registration closes"
                  value={formatDate(
                    campaign.registration_end
                  )}
                />

                <DetailItem
                  label="Distribution date"
                  value={formatDate(
                    campaign.distribution_date
                  )}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Product
              </h2>

              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Name"
                  value={product.name}
                />

                <DetailItem
                  label="Unit"
                  value={product.unit}
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Description"
                    value={product.description ?? "—"}
                  />
                </div>
              </dl>
            </section>
          </div>
        </div>

        {/* Distribution */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Distribution
            </h2>

            <Link
              href="/dashboard/distributions"
              className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
            >
              View distributions →
            </Link>
          </div>

          {distribution ? (
            <dl className="mt-5 grid gap-5 sm:grid-cols-3">
              <DetailItem
                label="Quantity distributed"
                value={distribution.quantity}
              />

              <DetailItem
                label="Status"
                value={distribution.status}
              />

              <DetailItem
                label="Distributed at"
                value={formatDateTime(
                  distribution.distributed_at
                )}
              />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              This allocation has not been distributed yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
