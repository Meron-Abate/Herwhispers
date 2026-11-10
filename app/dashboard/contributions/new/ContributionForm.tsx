"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createContribution,
  type ContributionFormState,
} from "@/app/actions/contributions";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/productCategories";

const initialState: ContributionFormState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const errorClass = "mt-1.5 text-sm text-rose-600";

type DropdownData = {
  partners: { id: string; company_name: string }[];
};

export default function ContributionForm({
  data,
  defaultPartnerId,
}: {
  data: DropdownData;
  defaultPartnerId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createContribution,
    initialState,
  );

  // Watch the contribution type so we can show/hide the manufacturer field
  const [contributionType, setContributionType] = useState("");

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Partner */}
        <div>
          <label htmlFor="partner_id" className={labelClass}>
            Partner <span className="text-rose-500">*</span>
          </label>
          <select
            id="partner_id"
            name="partner_id"
            required
            defaultValue={
              data.partners.some((p) => p.id === defaultPartnerId)
                ? defaultPartnerId
                : ""
            }
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

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select category
            </option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {PRODUCT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          {state.errors?.category && (
            <p className={errorClass}>{state.errors.category}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className={labelClass}>
            How many did they donate? <span className="text-rose-500">*</span>
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

        {/* Delivery status */}
        <div>
          <label htmlFor="delivery_status" className={labelClass}>
            Received?
          </label>
          <select
            id="delivery_status"
            name="delivery_status"
            defaultValue="DELIVERED"
            className={inputClass}
          >
            <option value="DELIVERED">Received. Add to stock now</option>
            <option value="PENDING">Not yet. Promised</option>
          </select>
          {state.errors?.delivery_status && (
            <p className={errorClass}>{state.errors.delivery_status}</p>
          )}
        </div>
      </div>

      {/* Contribution Type */}
      <div>
        <label htmlFor="contribution_type" className={labelClass}>
          Contribution Type <span className="text-rose-500">*</span>
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
            Manufacturer Name <span className="text-rose-500">*</span>
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

      <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-800">
        Donations go into one shared stock pool, counted by category. You give
        campaigns their share from the Allocations page.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/contributions"
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Add Contribution"}
        </button>
      </div>
    </form>
  );
}
