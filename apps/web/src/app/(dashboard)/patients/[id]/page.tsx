"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X,
  Pill, FileText, Calendar, Loader2,
} from "lucide-react";
import {
  patientApi, PatientDetail, Medication, MedicationCategory, PrimaryFocus,
} from "@/lib/api-client";
import {
  FOCUS_OPTIONS, MED_CATEGORY_OPTIONS,
  FOCUS_BADGE_COLOR, formatDate, calculateAge, initials,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Auto-saving text field ────────────────────────────────────────────────────
function AutoSaveField({
  label, value, onSave, placeholder,
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  placeholder: string;
}) {
  const [draft, setDraft]   = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(value), [value]);

  const handleBlur = async () => {
    if (draft === value) return;
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error(`Failed to save ${label.toLowerCase()}`);
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
        {saved && !saving && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDemo, setEditingDemo] = useState(false);
  const [demoDraft, setDemoDraft] = useState<Partial<PatientDetail>>({});

  // Medication dialog state
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medForm, setMedForm] = useState({
    category: "medication" as MedicationCategory,
    name: "", dose: "", frequency: "", notes: "",
  });
  const [deleteMedId, setDeleteMedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patientApi.get(id);
      setPatient(data);
      setDemoDraft(data);
    } catch {
      toast.error("Patient not found");
      router.push("/patients");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // ── Demographics save ─────────────────────────────────────────────────────
  const saveDemographics = async () => {
    if (!patient) return;
    try {
      const updated = await patientApi.update(patient.id, {
        first_name: demoDraft.first_name,
        last_name: demoDraft.last_name,
        dob: demoDraft.dob,
        sex: demoDraft.sex,
        email: demoDraft.email,
        phone: demoDraft.phone,
        primary_focus: demoDraft.primary_focus,
      });
      setPatient({ ...patient, ...updated });
      setEditingDemo(false);
      toast.success("Demographics updated");
    } catch {
      toast.error("Failed to update demographics");
    }
  };

  // ── Auto-save symptom/goal fields ─────────────────────────────────────────
  const saveField = async (field: "symptoms_goals" | "relevant_history", val: string) => {
    if (!patient) return;
    const updated = await patientApi.update(patient.id, { [field]: val });
    setPatient((p) => (p ? { ...p, [field]: updated[field] } : p));
  };

  // ── Medication CRUD ────────────────────────────────────────────────────────
  const openNewMed = () => {
    setEditingMed(null);
    setMedForm({ category: "medication", name: "", dose: "", frequency: "", notes: "" });
    setMedDialogOpen(true);
  };

  const openEditMed = (med: Medication) => {
    setEditingMed(med);
    setMedForm({
      category: med.category, name: med.name,
      dose: med.dose ?? "", frequency: med.frequency ?? "", notes: med.notes ?? "",
    });
    setMedDialogOpen(true);
  };

  const saveMed = async () => {
    if (!patient || !medForm.name.trim()) {
      toast.error("Medication name is required");
      return;
    }
    try {
      if (editingMed) {
        const updated = await patientApi.updateMedication(patient.id, editingMed.id, medForm);
        setPatient((p) => p ? {
          ...p,
          medications: p.medications.map((m) => m.id === updated.id ? updated : m),
        } : p);
        toast.success("Medication updated");
      } else {
        const created = await patientApi.createMedication(patient.id, { ...medForm, is_current: true });
        setPatient((p) => p ? { ...p, medications: [created, ...p.medications] } : p);
        toast.success("Medication added");
      }
      setMedDialogOpen(false);
    } catch {
      toast.error("Failed to save medication");
    }
  };

  const confirmDeleteMed = async () => {
    if (!patient || !deleteMedId) return;
    try {
      await patientApi.deleteMedication(patient.id, deleteMedId);
      setPatient((p) => p ? {
        ...p, medications: p.medications.filter((m) => m.id !== deleteMedId),
      } : p);
      toast.success("Medication removed");
    } catch {
      toast.error("Failed to remove medication");
    } finally {
      setDeleteMedId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!patient) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      {/* ── Header card ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-lg">
                {initials(patient.first_name, patient.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-sm text-slate-500">
                {formatDate(patient.dob)} · {calculateAge(patient.dob)} years old · <span className="capitalize">{patient.sex}</span>
              </p>
              <Badge className={`${FOCUS_BADGE_COLOR[patient.primary_focus]} border-0 capitalize mt-2`}>
                {patient.primary_focus}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => router.push(`/templates?patient=${patient.id}`)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <FileText className="w-4 h-4 mr-1.5" /> New Protocol
          </Button>
        </div>

        {/* Editable demographics */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Demographics</h3>
            {!editingDemo ? (
              <Button size="sm" variant="ghost" onClick={() => setEditingDemo(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditingDemo(false); setDemoDraft(patient); }}>
                  <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                </Button>
                <Button size="sm" onClick={saveDemographics} className="bg-purple-700 hover:bg-purple-800 text-white">
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Save
                </Button>
              </div>
            )}
          </div>

          {!editingDemo ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs mb-0.5">Email</p><p className="text-slate-700">{patient.email || "—"}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Phone</p><p className="text-slate-700">{patient.phone || "—"}</p></div>
              <div><p className="text-slate-400 text-xs mb-0.5">Last Updated</p><p className="text-slate-700">{formatDate(patient.updated_at)}</p></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name</Label>
                <Input value={demoDraft.first_name ?? ""} onChange={(e) => setDemoDraft({ ...demoDraft, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name</Label>
                <Input value={demoDraft.last_name ?? ""} onChange={(e) => setDemoDraft({ ...demoDraft, last_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Focus</Label>
                <Select value={demoDraft.primary_focus} onValueChange={(v) => setDemoDraft({ ...demoDraft, primary_focus: v as PrimaryFocus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOCUS_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date of Birth</Label>
                <Input type="date" value={demoDraft.dob ?? ""} onChange={(e) => setDemoDraft({ ...demoDraft, dob: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={demoDraft.email ?? ""} onChange={(e) => setDemoDraft({ ...demoDraft, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={demoDraft.phone ?? ""} onChange={(e) => setDemoDraft({ ...demoDraft, phone: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Symptoms & history (auto-save) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700">Clinical Intake</h3>
        <AutoSaveField
          label="Symptoms / Goals"
          value={patient.symptoms_goals ?? ""}
          placeholder="e.g. Optimize testosterone, improve energy and focus."
          onSave={(v) => saveField("symptoms_goals", v)}
        />
        <AutoSaveField
          label="Relevant History / Diagnoses"
          value={patient.relevant_history ?? ""}
          placeholder="e.g. Previously on testosterone enanthate IM."
          onSave={(v) => saveField("relevant_history", v)}
        />
      </div>

      {/* ── Medication log ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Pill className="w-4 h-4 text-slate-400" /> Current Regimen
          </h3>
          <Button size="sm" variant="outline" onClick={openNewMed}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
          </Button>
        </div>

        {patient.medications.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No medications, hormones, peptides, or supplements logged.</p>
        ) : (
          <div className="space-y-2">
            {patient.medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize text-xs">{med.category}</Badge>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{med.name}</p>
                    <p className="text-xs text-slate-400">
                      {[med.dose, med.frequency].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditMed(med)}>
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteMedId(med.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Visit history ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" /> Visit History
        </h3>
        {patient.visit_history.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No protocols generated yet.</p>
        ) : (
          <div className="space-y-2">
            {patient.visit_history.map((v) => (
              <Link
                key={v.id}
                href={`/editor/${v.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{v.template_name}</p>
                  <p className="text-xs text-slate-400">{formatDate(v.visit_date)} · {v.physician_name}</p>
                </div>
                <Badge variant={v.status === "final" ? "default" : "secondary"} className="capitalize">
                  {v.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Medication dialog ── */}
      <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMed ? "Edit Medication" : "Add Medication"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={medForm.category} onValueChange={(v) => setMedForm({ ...medForm, category: v as MedicationCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MED_CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={medForm.name}
                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                placeholder="e.g. Enclomiphene"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dose</Label>
                <Input
                  value={medForm.dose}
                  onChange={(e) => setMedForm({ ...medForm, dose: e.target.value })}
                  placeholder="e.g. 37.5 mg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Input
                  value={medForm.frequency}
                  onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                  placeholder="e.g. Mon/Wed/Fri"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={medForm.notes}
                onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMedDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveMed} className="bg-purple-700 hover:bg-purple-800 text-white">
              {editingMed ? "Save Changes" : "Add Medication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteMedId} onOpenChange={(open) => !open && setDeleteMedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the entry from the patient&apos;s regimen log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMed} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
