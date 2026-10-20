"use client";

import { useActionState } from "react";
import {
  createCampaign,
  type CampaignFormState,
} from "@/app/actions/campaigns";

type Assessment = { id: string; title: string };

const initialState: CampaignFormState = { ok: false };

// Reusable class strings — change once, affects everywhere
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-sm text-red-600";

export default function CampaignForm({
  assessments,
}: {
  assessments: Assessment[];
}) {
  const [state, formAction, isPending] = useActionState(
    createCampaign,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Campaign Name */}
      <div>
        <label htmlFor="name" className={labelClass}>
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="October 2026 Menstrual Product Support"
          className={inputClass}
        />
        {state.errors?.name && (
          <p className={errorClass}>{state.errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Describe this campaign…"
          className={inputClass}
        />
      </div>

      {/* Assessment */}
      <div>
        <label htmlFor="assessment_id" className={labelClass}>
          Assessment <span className="text-red-500">*</span>
        </label>
        <select
          id="assessment_id"
          name="assessment_id"
          required
          className={inputClass}
        >
          <option value="">Select an assessment</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        {state.errors?.assessment_id && (
          <p className={errorClass}>{state.errors.assessment_id}</p>
        )}
        {assessments.length === 0 && (
          <p className={errorClass}>No active assessments are available.</p>
        )}
      </div>

      {/* Registration dates — side by side on wider screens */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="registration_start" className={labelClass}>
            Registration Start <span className="text-red-500">*</span>
          </label>
          <input
            id="registration_start"
            name="registration_start"
            type="datetime-local"
            required
            className={inputClass}
          />
          {state.errors?.registration_start && (
            <p className={errorClass}>{state.errors.registration_start}</p>
          )}
        </div>

        <div>
          <label htmlFor="registration_end" className={labelClass}>
            Registration End <span className="text-red-500">*</span>
          </label>
          <input
            id="registration_end"
            name="registration_end"
            type="datetime-local"
            required
            className={inputClass}
          />
          {state.errors?.registration_end && (
            <p className={errorClass}>{state.errors.registration_end}</p>
          )}
        </div>
      </div>

      {/* Distribution Date (optional) */}
      <div>
        <label htmlFor="distribution_date" className={labelClass}>
          Distribution Date{" "}
          <span className="text-xs font-normal text-gray-400">(Optional)</span>
        </label>
        <input
          id="distribution_date"
          name="distribution_date"
          type="datetime-local"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Leave blank if the distribution date isn&apos;t known yet.
        </p>
        {state.errors?.distribution_date && (
          <p className={errorClass}>{state.errors.distribution_date}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={assessments.length === 0 || isPending}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isPending ? "Creating…" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}
