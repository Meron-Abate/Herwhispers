"use client";

import { useActionState, useState } from "react";
import {
  completeCampaign,
  type CompleteCampaignState,
} from "@/app/actions/campaigns";

const initialState: CompleteCampaignState = { ok: false };

export default function CompleteCampaignButton({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const [state, formAction, isPending] = useActionState(
    completeCampaign,
    initialState,
  );
  const [showConfirm, setShowConfirm] = useState(false);

  // If already completed/cancelled, don't show the button
  if (status === "COMPLETED") {
    return <span className="text-sm text-gray-500">Completed</span>;
  }
  if (status === "CANCELLED") {
    return <span className="text-sm text-gray-500">Cancelled</span>;
  }

  return (
    <div>
      {/* Trigger Button */}
      {!showConfirm && (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Mark Complete
        </button>
      )}

      {/* Confirmation Form */}
      {showConfirm && (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="campaignId" value={campaignId} />
          <span className="text-xs text-gray-600">Are you sure?</span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {isPending ? "Completing…" : "Yes, complete"}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Feedback */}
      {state.message && (
        <p
          className={`mt-2 text-xs ${state.ok ? "text-green-600" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
