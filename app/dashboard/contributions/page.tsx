import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markContributionDelivered } from "@/app/actions/contributions";
import CategoryBadge from "@/app/dashboard/CategoryBadge";
import PageHeader from "@/app/dashboard/PageHeader";
import StatusBadge from "@/app/dashboard/StatusBadge";

const th =
  "px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

export default async function ContributionsPage() {
  const contributions = await prisma.partner_contributions.findMany({
    include: {
      partners: true,
      campaigns: true,
      products: true,
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Partner Contributions"
          description="What each partner donated. Delivered donations count towards the inventory."
        />
        <Link
          href="/dashboard/contributions/new"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          + Record Contribution
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              <th className={th}>Partner</th>
              <th className={th}>Category</th>
              <th className={th}>Quantity</th>
              <th className={th}>Assigned to</th>
              <th className={th}>Status</th>
              <th className={th}>Date</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {contributions.map((c) => (
              <tr key={c.id} className="transition hover:bg-violet-50/40">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {c.partners.company_name}
                </td>
                <td className="px-6 py-4">
                  <CategoryBadge category={c.products.category} />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {c.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {c.campaigns?.name ?? "Shared pool"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={c.delivery_status} />
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {c.delivered_at
                    ? c.delivered_at.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {(c.delivery_status === "PENDING" ||
                    c.delivery_status === "PARTIALLY_DELIVERED") && (
                    <form action={markContributionDelivered}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="font-medium text-violet-700 hover:underline"
                      >
                        Mark delivered
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {contributions.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No contributions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
