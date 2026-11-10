const TONES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  info: "bg-violet-50 text-violet-700 ring-violet-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
}

const DOT: Record<string, string> = {
  success: "bg-emerald-500",
  info: "bg-violet-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
}

function toneFor(status: string) {
  const value = status.toUpperCase()

  if (/(NOT_ELIGIBLE|REJECT|CANCEL|INACTIVE|FAILED|EXPIRED)/.test(value)) {
    return "danger"
  }

  if (
    /(VERIFIED|ELIGIBLE|ACTIVE|ANSWERED|APPROVED|DISTRIBUTED|COLLECTED|DELIVERED|COMPLETED|CONFIRMED)/.test(
      value
    )
  ) {
    return "success"
  }

  if (/(ALLOCATED|ASSIGNED|DISTRIBUTION|PROPOSED)/.test(value)) {
    return "info"
  }

  if (/(PENDING|WAITING|DRAFT|UPCOMING|REVIEW|PARTIAL|PAUSED)/.test(value)) {
    return "warning"
  }

  return "neutral"
}

export default function StatusBadge({
  status,
  tone,
}: {
  status: string | null | undefined
  tone?: keyof typeof TONES
}) {
  if (!status) {
    return <span className="text-slate-400">—</span>
  }

  const resolved = tone ?? toneFor(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[resolved]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[resolved]}`} />
      {status.replaceAll("_", " ")}
    </span>
  )
}
