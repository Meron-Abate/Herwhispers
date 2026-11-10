"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function DeleteQuestionButton({
  questionId,
  redirectTo,
  className = "",
}: {
  questionId: string
  /** Where to go after deleting. Omit to just refresh the current page. */
  redirectTo?: string
  className?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function remove() {
    if (
      !window.confirm(
        "Delete this question and all of its answer options? This cannot be undone."
      )
    ) {
      return
    }

    setBusy(true)
    setError("")

    try {
      const response = await fetch(`/api/assessments/questions/${questionId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Could not delete the question.")
        return
      }

      if (redirectTo) {
        router.push(redirectTo)
      }

      router.refresh()
    } catch {
      setError("Could not delete the question.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className={`inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 ${className}`}
      >
        {busy ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="mt-2 max-w-xs text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
