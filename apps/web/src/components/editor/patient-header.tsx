"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HeaderData } from "@/lib/api-client";

interface PatientHeaderProps {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

const FIELDS: { key: keyof HeaderData; label: string }[] = [
  { key: "patient_name",    label: "Patient Name" },
  { key: "dob",             label: "DOB" },
  { key: "visit_date",      label: "Visit Date" },
  { key: "primary_focus",   label: "Primary Focus" },
  { key: "current_regimen", label: "Current Regimen" },
  { key: "compared_to",     label: "Compared To" },
];

export function PatientHeader({ data, onChange }: PatientHeaderProps) {
  const update = (key: keyof HeaderData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-slate-100 bg-purple-50 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-purple-800">Protocol Header</h4>
        <span className="text-[10px] text-purple-400 uppercase font-medium tracking-wide">
          Locked structure
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-100">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="bg-white px-3 py-2">
            <Label className="text-xs text-slate-400">{label}</Label>
            <Input
              value={data[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="border-0 px-0 h-7 text-sm focus-visible:ring-0 shadow-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}