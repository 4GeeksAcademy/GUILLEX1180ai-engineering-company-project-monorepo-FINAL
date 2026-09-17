import type { CandidateStatus, CandidateStage } from "@/lib/types";

// Colores por status
const STATUS_COLORS: Record<string, string> = {
  applied:   "bg-blue-100 text-blue-800",
  screening: "bg-indigo-100 text-indigo-800",
  interview: "bg-yellow-100 text-yellow-800",
  on_hold:   "bg-orange-100 text-orange-800",
  hired:     "bg-green-100 text-green-800",
  rejected:  "bg-red-100 text-red-800",
};

const STAGE_COLORS: Record<string, string> = {
  new:            "bg-gray-100 text-gray-800",
  review:         "bg-sky-100 text-sky-800",
  phone_screen:   "bg-cyan-100 text-cyan-800",
  technical:      "bg-violet-100 text-violet-800",
  final_interview:"bg-purple-100 text-purple-800",
  offer:          "bg-emerald-100 text-emerald-800",
  hired:          "bg-green-100 text-green-800",
  rejected:       "bg-red-100 text-red-800",
};

function humanize(str: string) {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  value,
  type = "status",
}: {
  value: string;
  type?: "status" | "stage";
}) {
  const colors =
    type === "status"
      ? STATUS_COLORS[value] || "bg-gray-100 text-gray-800"
      : STAGE_COLORS[value] || "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${colors}`}>
      {humanize(value)}
    </span>
  );
}
