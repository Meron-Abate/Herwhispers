"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { removeStudent } from "@/app/actions/students"

export default function DeleteStudentButton({
  studentId,
  studentName,
  redirectTo,
  className = "font-medium text-rose-600 hover:underline",
}: {
  studentId: string
  studentName: string
  /** Where to go after deleting. Omit to stay on the current page. */
  redirectTo?: string
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function remove() {
    if (
      !window.confirm(
        `Delete ${studentName}?\n\nTheir test answers, participant record and QR code are removed too. They can register again from the bot.`
      )
    ) {
      return
    }

    setError("")

    startTransition(async () => {
      const result = await removeStudent(studentId)

      if (!result.ok) {
        setError(result.error ?? "Could not delete the student.")
        return
      }

      if (redirectTo) {
        router.push(redirectTo)
      }

      router.refresh()
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={`${className} disabled:opacity-50`}
      >
        {pending ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="mt-1 max-w-[220px] text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
