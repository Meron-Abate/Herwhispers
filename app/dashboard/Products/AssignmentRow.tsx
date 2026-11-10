"use client"

import { useState, useTransition } from "react"
import { setCampaignStock } from "@/app/actions/inventory"

export default function AssignmentRow({
  campaignProductId,
  assigned,
  allocated,
}: {
  campaignProductId: string
  assigned: number
  allocated: number
}) {
  const [value, setValue] = useState(String(assigned))
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  const changed = value !== String(assigned)

  function save() {
    setError("")

    startTransition(async () => {
      const result = await setCampaignStock(campaignProductId, Number(value))

      if (!result.ok) {
        setError(result.error ?? "Could not save.")
        setValue(String(assigned))
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={allocated}
          step={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
        />

        <button
          type="button"
          onClick={save}
          disabled={pending || !changed}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <p className="mt-1 max-w-xs text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
