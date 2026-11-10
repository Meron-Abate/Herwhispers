"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type OptionData = {
  id: string
  label: string
  score_weight: number
  is_disqualifier: boolean
}

type RowState = {
  label: string
  score: string
  disqualifier: boolean
}

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"

function OptionRow({ option }: { option: OptionData }) {
  const router = useRouter()

  const [row, setRow] = useState<RowState>({
    label: option.label,
    score: String(option.score_weight),
    disqualifier: option.is_disqualifier,
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{
    kind: "ok" | "error"
    text: string
  } | null>(null)

  const changed =
    row.label !== option.label ||
    row.score !== String(option.score_weight) ||
    row.disqualifier !== option.is_disqualifier

  async function save() {
    setBusy(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/assessments/options/${option.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: row.label,
          scoreWeight: row.score,
          isDisqualifier: row.disqualifier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ kind: "error", text: data.error ?? "Could not save." })
        return
      }

      setMessage({ kind: "ok", text: "Saved" })
      router.refresh()
    } catch {
      setMessage({ kind: "error", text: "Could not save." })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the option "${option.label}"?`)) {
      return
    }

    setBusy(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/assessments/options/${option.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ kind: "error", text: data.error ?? "Could not delete." })
        return
      }

      router.refresh()
    } catch {
      setMessage({ kind: "error", text: "Could not delete." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Answer
          </span>
          <input
            value={row.label}
            onChange={(event) =>
              setRow({ ...row, label: event.target.value })
            }
            className={`${inputClass} w-full`}
          />
        </label>

        <label className="w-24 text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Score
          </span>
          <input
            type="number"
            step={1}
            value={row.score}
            onChange={(event) =>
              setRow({ ...row, score: event.target.value })
            }
            className={`${inputClass} w-full`}
          />
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={row.disqualifier}
            onChange={(event) =>
              setRow({ ...row, disqualifier: event.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Disqualifier
        </label>

        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={save}
            disabled={busy || !changed}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>

          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mt-2 text-xs font-medium ${
            message.kind === "ok" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}

function NewOptionRow({
  assessmentId,
  questionId,
}: {
  assessmentId: string
  questionId: string
}) {
  const router = useRouter()

  const [label, setLabel] = useState("")
  const [score, setScore] = useState("0")
  const [disqualifier, setDisqualifier] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function add() {
    setBusy(true)
    setError("")

    try {
      const form = new FormData()
      form.set("assessment_id", assessmentId)
      form.set("question_id", questionId)
      form.set("label", label)
      form.set("score_weight", score)

      if (disqualifier) {
        form.set("is_disqualifier", "on")
      }

      const response = await fetch("/api/assessments/options", {
        method: "POST",
        body: form,
        redirect: "manual",
      })

      // The create route redirects on success, which fetch reports as an
      // opaque redirect rather than an ok response.
      if (response.type !== "opaqueredirect" && !response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error ?? "Could not add the option.")
        return
      }

      setLabel("")
      setScore("0")
      setDisqualifier(false)
      router.refresh()
    } catch {
      setError("Could not add the option.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            New answer
          </span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Yes"
            className={`${inputClass} w-full`}
          />
        </label>

        <label className="w-24 text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Score
          </span>
          <input
            type="number"
            step={1}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className={`${inputClass} w-full`}
          />
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={disqualifier}
            onChange={(event) => setDisqualifier(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Disqualifier
        </label>

        <button
          type="button"
          onClick={add}
          disabled={busy || !label.trim()}
          className="mb-0.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add
        </button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export default function OptionsEditor({
  assessmentId,
  questionId,
  options,
}: {
  assessmentId: string
  questionId: string
  options: OptionData[]
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Answer options</h2>

      <p className="mt-1 mb-5 text-sm text-slate-500">
        Change the wording or score of each answer and press Save on that row.
        New scores apply to answers given from now on. Answers students have
        already given keep the score they were given at the time.
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <OptionRow key={option.id} option={option} />
        ))}

        {options.length === 0 && (
          <p className="text-sm text-slate-500">No answer options yet.</p>
        )}

        <NewOptionRow assessmentId={assessmentId} questionId={questionId} />
      </div>
    </div>
  )
}
