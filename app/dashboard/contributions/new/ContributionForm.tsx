"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createContribution,
  type ContributionFormState,
} from "@/app/actions/contributions";

const initialState: ContributionFormState = { ok: false };


const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-sm text-red-600";

type DropdownData = {
  partners: { id: string; company_name: string }[];
  campaigns: { id: string; name: string }[];
  products: { id: string; name: string }[];
};

export default function ContributionForm({ data }: { data: DropdownData }) {
  const [state, formAction, isPending] = useActionState(
    createContribution,
    initialState,
  );

  // State to watch the contribution type so we can show/hide the manufacturer field
  const [contributionType, setContributionType] = useState("");

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Contribution Type */}
      <div>
        <label htmlFor="contribution_type" className={labelClass}>
          Contribution Type <span className="text-red-500">*</span>
        </label>
        <select
          id="contribution_type"
          name="contribution_type"
          required
          className={inputClass}
          onChange={(e) => setContributionType(e.target.value)}
        >
          <option value="">Select type</option>
          <option value="PHYSICAL_PRODUCT">Physical Product</option>
          <option value="SUPPORT_THROUGH_PAYING_MANUFACTURER">
            Support Through Paying Manufacturer
          </option>
        </select>
        {state.errors?.contribution_type && (
          <p className={errorClass}>{state.errors.contribution_type}</p>
        )}
      </div>

      {/* Conditional Manufacturer Name */}
      {contributionType === "SUPPORT_THROUGH_PAYING_MANUFACTURER" && (
        <div>
          <label htmlFor="manufacturer_name" className={labelClass}>
            Manufacturer Name <span className="text-red-500">*</span>
          </label>
          <input
            id="manufacturer_name"
            name="manufacturer_name"
            type="text"
            required
            placeholder="e.g., Addis Pads Factory"
            className={inputClass}
          />
          {state.errors?.manufacturer_name && (
            <p className={errorClass}>{state.errors.manufacturer_name}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Partner */}
        <div>
          <label htmlFor="partner_id" className={labelClass}>
            Partner <span className="text-red-500">*</span>
          </label>
          <select
            id="partner_id"
            name="partner_id"
            required
            className={inputClass}
          >
            <option value="">Select partner</option>
            {data.partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name}
              </option>
            ))}
          </select>
          {state.errors?.partner_id && (
            <p className={errorClass}>{state.errors.partner_id}</p>
          )}
        </div>

        {/* Campaign */}
        <div>
          <label htmlFor="campaign_id" className={labelClass}>
            Campaign <span className="text-red-500">*</span>
          </label>
          <select
            id="campaign_id"
            name="campaign_id"
            required
            className={inputClass}
          >
            <option value="">Select campaign</option>
            {data.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.errors?.campaign_id && (
            <p className={errorClass}>{state.errors.campaign_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Product */}
        <div>
          <label htmlFor="product_id" className={labelClass}>
            Product <span className="text-red-500">*</span>
          </label>
          <select
            id="product_id"
            name="product_id"
            required
            className={inputClass}
          >
            <option value="">Select product</option>
            {data.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {state.errors?.product_id && (
            <p className={errorClass}>{state.errors.product_id}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className={labelClass}>
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            required
            placeholder="e.g., 1000"
            className={inputClass}
          />
          {state.errors?.quantity && (
            <p className={errorClass}>{state.errors.quantity}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any additional details..."
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/contributions"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:bg-gray-300"
        >
          {isPending ? "Saving…" : "Add Contribution"}
        </button>
      </div>
    </form>
  );
}
