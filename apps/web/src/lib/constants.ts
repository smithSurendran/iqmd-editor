import type { PrimaryFocus, Sex, MedicationCategory } from "./api-client";

export const FOCUS_OPTIONS: { value: PrimaryFocus; label: string }[] = [
  { value: "general",    label: "General" },
  { value: "hormones",   label: "Hormones" },
  { value: "metabolic",  label: "Metabolic" },
  { value: "thyroid",    label: "Thyroid" },
  { value: "fertility",  label: "Fertility" },
  { value: "genomics",   label: "Genomics" },
];

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
];

export const MED_CATEGORY_OPTIONS: { value: MedicationCategory; label: string }[] = [
  { value: "medication", label: "Medication" },
  { value: "hormone",    label: "Hormone" },
  { value: "peptide",    label: "Peptide" },
  { value: "iv",         label: "IV Infusion" },
  { value: "supplement", label: "Supplement" },
];

export const FOCUS_BADGE_COLOR: Record<PrimaryFocus, string> = {
  general:   "bg-slate-100 text-slate-700",
  hormones:  "bg-amber-100 text-amber-700",
  metabolic: "bg-blue-100 text-blue-700",
  thyroid:   "bg-teal-100 text-teal-700",
  fertility: "bg-pink-100 text-pink-700",
  genomics:  "bg-purple-100 text-purple-700",
};

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}