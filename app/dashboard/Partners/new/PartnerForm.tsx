"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPartner, type PartnerFormState } from "@/app/actions/partners";

const initialState: PartnerFormState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-sm text-red-600";

export default function PartnerForm() {
  const [state, formAction, isPending] = useActionState(
    createPartner,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Company Name */}
      <div>
        <label htmlFor="company_name" className={labelClass}>
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          required
          placeholder="e.g., Acme Manufacturing"
          className={inputClass}
        />
        {state.errors?.company_name && (
          <p className={errorClass}>{state.errors.company_name}</p>
        )}
      </div>

      {/* Contact Person */}
      <div>
        <label htmlFor="contact_person" className={labelClass}>
          Contact Person
        </label>
        <input
          id="contact_person"
          name="contact_person"
          type="text"
          placeholder="e.g., Jane Doe"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jane@example.com"
          className={inputClass}
        />
        {state.errors?.email && (
          <p className={errorClass}>{state.errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+251 900 000 000"
          className={inputClass}
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className={labelClass}>
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="e.g., Bole, Addis Ababa"
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dashboard/partners"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isPending ? "Creating…" : "Create Partner"}
        </button>
      </div>
    </form>
  );
}
