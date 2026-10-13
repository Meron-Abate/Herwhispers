import Link from "next/link"
import { prisma } from "@/lib/prisma"

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function monthsBetween(start: Date, end: Date) {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  return Math.max(months, 1)
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function StatCard({
  tint,
  chip,
  label,
  value,
  sub,
}: {
  tint: string
  chip: string
  label: string
  value: string
  sub: string
}) {
  return (
    <div className={`rounded-2xl p-6 ${tint}`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${chip}`}
        >
          {label === "Total Registered Students" && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          )}
          {label === "Eligible Students" && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {label === "Products Secured" && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          )}
          {label === "Products Distributed" && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          )}
        </span>

        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{sub}</p>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [
    studentsCount,
    eligibleCount,
    partnersCount,
    contributionsTotal,
    distributionsTotal,
    distributions,
    universitiesCount,
    campaigns,
  ] = await Promise.all([
    prisma.students.count(),
    prisma.assessment_attempts.count({
      where: { result: "ELIGIBLE" },
    }),
    prisma.partners.count(),
    prisma.partner_contributions.aggregate({
      _sum: { quantity: true },
    }),
    prisma.distributions.aggregate({
      _sum: { quantity: true },
    }),
    prisma.distributions.findMany({
      select: { campaign_id: true, participant_id: true, quantity: true },
    }),
    prisma.universities.count(),
    prisma.campaigns.findMany({
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { created_at: "desc" },
      take: 4,
    }),
  ])

  const secured = contributionsTotal._sum.quantity ?? 0
  const distributed = distributionsTotal._sum.quantity ?? 0
  const remaining = Math.max(secured - distributed, 0)
  const reachedStudents = new Set(
    distributions.map((d) => d.participant_id)
  ).size

  const eligibleShare =
    studentsCount > 0
      ? Math.round((eligibleCount / studentsCount) * 100)
      : 0

  const distributedShare =
    secured > 0 ? Math.round((distributed / secured) * 100) : 0
  const remainingShare = 100 - distributedShare

  const distributedByCampaign = new Map<string, number>()
  for (const d of distributions) {
    distributedByCampaign.set(
      d.campaign_id,
      (distributedByCampaign.get(d.campaign_id) ?? 0) + d.quantity
    )
  }

  const activeCampaign =
    campaigns.find((c) => c.status === "ACTIVE") ?? campaigns[0] ?? null

  // Donut geometry
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const distributedArc = (distributedShare / 100) * circumference

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        {greeting()}, Admin
      </h1>
      <p className="mt-1 text-slate-500">
        Here&apos;s what&apos;s happening with HerWhispers.
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tint="bg-violet-50"
          chip="bg-violet-200/70 text-violet-600"
          label="Total Registered Students"
          value={studentsCount.toLocaleString()}
          sub={`Across ${universitiesCount} ${
            universitiesCount === 1 ? "university" : "universities"
          }`}
        />
        <StatCard
          tint="bg-emerald-50"
          chip="bg-emerald-100 text-emerald-600"
          label="Eligible Students"
          value={eligibleCount.toLocaleString()}
          sub={`${eligibleShare}% of registered`}
        />
        <StatCard
          tint="bg-rose-50"
          chip="bg-rose-200/70 text-rose-600"
          label="Products Secured"
          value={secured.toLocaleString()}
          sub={`From ${partnersCount} ${
            partnersCount === 1 ? "partner" : "partners"
          }`}
        />
        <StatCard
          tint="bg-blue-50"
          chip="bg-blue-100 text-blue-600"
          label="Products Distributed"
          value={distributed.toLocaleString()}
          sub={`To ${reachedStudents.toLocaleString()} students`}
        />
      </div>

      {/* Campaign row */}
      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Current Campaign
            </h2>
            {activeCampaign && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeCampaign.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {activeCampaign.status === "ACTIVE"
                  ? "Active"
                  : activeCampaign.status.charAt(0) +
                    activeCampaign.status.slice(1).toLowerCase()}
              </span>
            )}
          </div>

          {activeCampaign ? (
            <>
              <p className="mt-4 font-semibold text-slate-900">
                {activeCampaign.name}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {formatDate(activeCampaign.registration_start)}
                {" – "}
                {formatDate(activeCampaign.registration_end)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="border-l border-slate-100 pl-4 first:border-l-0 first:pl-0">
                  <p className="text-sm text-slate-500">Eligible Students</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {activeCampaign._count.participants.toLocaleString()}
                  </p>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <p className="text-sm text-slate-500">Products Secured</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {secured.toLocaleString()}{" "}
                    <span className="text-sm font-medium">packs</span>
                  </p>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <p className="text-sm text-slate-500">Distributed</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {distributed.toLocaleString()}{" "}
                    <span className="text-sm font-medium">packs</span>
                  </p>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <p className="text-sm text-slate-500">Coverage Period</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {monthsBetween(
                      activeCampaign.registration_start,
                      activeCampaign.registration_end
                    )}{" "}
                    <span className="text-sm font-medium">months</span>
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/campaigns"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-600"
              >
                View Campaign Details
                <span aria-hidden="true">›</span>
              </Link>
            </>
          ) : (
            <div className="mt-4 text-sm text-slate-500">
              <p className="font-medium text-slate-900">
                No campaigns yet.
              </p>
              <p className="mt-1">
                Create your first campaign to start supporting students.
              </p>
              <Link
                href="/dashboard/campaigns/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-600"
              >
                Create Campaign
                <span aria-hidden="true">›</span>
              </Link>
            </div>
          )}
        </div>

        {/* Donut */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            Secured vs. Distributed
          </h2>

          <div className="mt-4 flex items-center gap-6">
            <div className="relative shrink-0">
              <svg width="170" height="170" viewBox="0 0 170 170">
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="22"
                />
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="none"
                  stroke="#8b7cf6"
                  strokeWidth="22"
                  strokeLinecap="round"
                  strokeDasharray={`${distributedArc} ${circumference}`}
                  transform="rotate(-90 85 85)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-slate-900">
                  {distributed.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">packs</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  Distributed Products
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {distributed.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-slate-500">
                    ({distributedShare}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  Remaining Stock
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {remaining.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-slate-500">
                    ({remainingShare}%)
                  </span>
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm text-slate-500">Total Secured</p>
                <p className="text-lg font-bold text-slate-900">
                  {secured.toLocaleString()} packs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Campaigns
            </h2>
            <Link
              href="/dashboard/campaigns"
              className="text-sm font-medium text-violet-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No campaigns yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="rounded-xl bg-slate-50 text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">
                      Eligible Students
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Products Distributed
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {campaign.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {formatDate(campaign.registration_start)}
                        {" – "}
                        {formatDate(campaign.registration_end)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {campaign._count.participants.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {(
                          distributedByCampaign.get(campaign.id) ?? 0
                        ).toLocaleString()}{" "}
                        packs
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            campaign.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : campaign.status === "COMPLETED"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {campaign.status === "ACTIVE"
                            ? "Active"
                            : campaign.status.charAt(0) +
                              campaign.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-4 space-y-3">
            {[
              {
                href: "/dashboard/campaigns/new",
                label: "Create New Campaign",
                chip: "bg-violet-100 text-violet-600",
                tint: "bg-violet-50 hover:bg-violet-100",
                glyph: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
              },
              {
                href: "/dashboard/Partners/new",
                label: "Register a Partner",
                chip: "bg-emerald-100 text-emerald-600",
                tint: "bg-emerald-50 hover:bg-emerald-100",
                glyph: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                ),
              },
              {
                href: "/dashboard/Products/new",
                label: "Update Inventory",
                chip: "bg-orange-100 text-orange-600",
                tint: "bg-orange-50 hover:bg-orange-100",
                glyph: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ),
              },
              {
                href: "/dashboard/distributions",
                label: "View Distributions",
                chip: "bg-blue-100 text-blue-600",
                tint: "bg-blue-50 hover:bg-blue-100",
                glyph: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${action.tint}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${action.chip}`}
                >
                  {action.glyph}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700">
                  {action.label}
                </span>
                <span className="text-slate-400" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
