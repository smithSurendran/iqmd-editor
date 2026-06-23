"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplementRow } from "@/lib/api-client";

interface SupplementTableProps {
  rows: SupplementRow[];
  onChange: (rows: SupplementRow[]) => void;
}

export function SupplementTable({ rows, onChange }: SupplementTableProps) {
  const addRow = () => {
    onChange([...rows, { id: crypto.randomUUID(), name: "", dose: "", timing: "", purpose: "" }]);
  };

  const updateRow = (id: string, field: keyof SupplementRow, value: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Final Supplementation List</h4>
        <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No supplements added yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">Supplement</th>
              <th className="px-3 py-2 w-32">Dose</th>
              <th className="px-3 py-2 w-40">Timing</th>
              <th className="px-3 py-2">Purpose</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                <td className="px-1.5 py-1">
                  <Input value={row.name} onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    placeholder="Supplement name" className="h-8 border-0 shadow-none focus-visible:ring-1" />
                </td>
                <td className="px-1.5 py-1">
                  <Input value={row.dose} onChange={(e) => updateRow(row.id, "dose", e.target.value)}
                    placeholder="Dose" className="h-8 border-0 shadow-none focus-visible:ring-1" />
                </td>
                <td className="px-1.5 py-1">
                  <Input value={row.timing} onChange={(e) => updateRow(row.id, "timing", e.target.value)}
                    placeholder="Timing" className="h-8 border-0 shadow-none focus-visible:ring-1" />
                </td>
                <td className="px-1.5 py-1">
                  <Input value={row.purpose} onChange={(e) => updateRow(row.id, "purpose", e.target.value)}
                    placeholder="Purpose" className="h-8 border-0 shadow-none focus-visible:ring-1" />
                </td>
                <td className="px-1.5 py-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeRow(row.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}