import { categoryLabel } from "@/lib/productCategories"

const TONES: Record<string, string> = {
  DISPOSABLE_PAD: "bg-sky-50 text-sky-700 ring-sky-600/20",
  REUSABLE_PAD: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  TAMPON: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20",
  OTHER: "bg-slate-100 text-slate-600 ring-slate-500/20",
}

export default function CategoryBadge({
  category,
}: {
  category: string | null | undefined
}) {
  const tone = TONES[category ?? "OTHER"] ?? TONES.OTHER

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {categoryLabel(category)}
    </span>
  )
}
