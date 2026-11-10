"use client"

import { useActionState } from "react"
import {
  assignStockToCampaign,
  type InventoryActionResult,
} from "@/app/actions/inventory"
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/productCategories"

const initialState: InventoryActionResult = { ok: false }

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"

export default function AssignStockForm({
  campaigns,
  unassigned,
}: {
  campaigns: { id: string; name: string }[]
  unassigned: Record<ProductCategory, number>
}) {
  const [state, formAction, pending] = useActionState(
    assignStockToCampaign,
    initialState
  )

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        Assign stock to a campaign
      </h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Take part of the pool and give it to a campaign. The campaign can then
        allocate it to its verified participants.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Category
          </span>
          <select
            name="category"
            required
            defaultValue=""
            className={`${inputClass} min-w-[190px]`}
          >
            <option value="" disabled>
              Select category
            </option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option
                key={category}
                value={category}
                disabled={unassigned[category] === 0}
              >
                {PRODUCT_CATEGORY_LABELS[category]} ({unassigned[category]}{" "}
                free)
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Campaign
          </span>
          <select
            name="campaign_id"
            required
            defaultValue=""
            className={`${inputClass} min-w-[220px]`}
          >
            <option value="" disabled>
              Select campaign
            </option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Quantity
          </span>
          <input
            name="quantity"
            type="number"
            min={1}
            step={1}
            required
            placeholder="e.g. 500"
            className={`${inputClass} w-32`}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? "Assigning..." : "Assign"}
        </button>
      </div>

      {state.error && (
        <p className="mt-3 text-sm font-medium text-rose-600">{state.error}</p>
      )}

      {state.ok && !state.error && (
        <p className="mt-3 text-sm font-medium text-emerald-600">
          Stock assigned.
        </p>
      )}
    </form>
  )
}
