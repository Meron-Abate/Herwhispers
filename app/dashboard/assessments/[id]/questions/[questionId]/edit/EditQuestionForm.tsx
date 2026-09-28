"use client"

import Link from "next/link"
import { useState } from "react"

type QuestionData = {
  id: string
  prompt: string
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMBER"
  is_required: boolean
  order_index: number
}

export default function EditQuestionForm({
  question,
  assessmentId,
}: {
  question: QuestionData
  assessmentId: string
}) {
  const [prompt, setPrompt] = useState(question.prompt)
  const [type, setType] = useState(question.type)
  const [isRequired, setIsRequired] = useState(question.is_required)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setSaving(true)
    setError("")

    try {
      const response = await fetch(
        `/api/assessments/questions/${question.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            type,
            isRequired,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update question.")
        return
      }

      window.location.href =
        `/dashboard/assessments/${assessmentId}/questions/${question.id}`
    } catch (error) {
      console.error("QUESTION UPDATE ERROR:", error)
      setError("Something went wrong while updating the question.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="prompt"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Question
          </label>

          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Question Type
          </label>

          <select
            id="type"
            value={type}
            onChange={(event) =>
              setType(
                event.target.value as
                  | "SINGLE_CHOICE"
                  | "MULTIPLE_CHOICE"
                  | "NUMBER"
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          >
            <option value="SINGLE_CHOICE">
              Single Choice
            </option>

            <option value="MULTIPLE_CHOICE">
              Multiple Choice
            </option>

            <option value="NUMBER">
              Number
            </option>
          </select>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="isRequired"
            type="checkbox"
            checked={isRequired}
            onChange={(event) =>
              setIsRequired(event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />

          <div>
            <label
              htmlFor="isRequired"
              className="text-sm font-medium text-gray-900"
            >
              Required question
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Students must answer this question before submitting
              the assessment.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <Link
            href={`/dashboard/assessments/${assessmentId}/questions/${question.id}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}