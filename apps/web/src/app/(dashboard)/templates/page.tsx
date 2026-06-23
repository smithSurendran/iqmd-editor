"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FileText, Lock, Loader2 } from "lucide-react";
import { templateApi, documentApi, patientApi, Template, Patient } from "@/lib/api-client";
import { FOCUS_OPTIONS, FOCUS_BADGE_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TemplateGalleryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const patientId = params.get("patient");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [patient, setPatient]     = useState<Patient | null>(null);
  const [activeFocus, setActiveFocus] = useState("all");
  const [loading, setLoading]     = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await templateApi.list();
        setTemplates(list);
        if (patientId) setPatient(await patientApi.get(patientId));
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  const filtered = activeFocus === "all"
    ? templates
    : templates.filter((t) => t.focus_category === activeFocus);

  const handleSelect = async (template: Template) => {
    if (!patientId) {
      toast.error("Select a patient first to start a protocol");
      router.push("/patients");
      return;
    }
    setCreatingId(template.id);
    try {
      const doc = await documentApi.create({
        patient_id: patientId,
        template_id: template.id,
        visit_date: new Date().toISOString().slice(0, 10),
      });
      router.push(`/editor/${doc.id}`);
    } catch {
      toast.error("Failed to create protocol");
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
      <p className="text-slate-500 mt-1 text-sm mb-1">
        {patient
          ? <>Choose a template to start a protocol for <span className="font-medium text-slate-700">{patient.first_name} {patient.last_name}</span></>
          : "Browse the IQMD protocol template library"}
      </p>
      {!patient && (
        <p className="text-xs text-amber-600 mb-6">
          No patient selected — choose a patient first to start a new protocol.
        </p>
      )}

      <Tabs value={activeFocus} onValueChange={setActiveFocus} className="mb-6 mt-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {FOCUS_OPTIONS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-700" />
                </div>
                {t.is_locked && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-3 flex-1">{t.description}</p>
              <div className="flex items-center justify-between">
                <Badge className={`${FOCUS_BADGE_COLOR[t.focus_category]} border-0 capitalize`}>
                  {t.focus_category}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleSelect(t)}
                  disabled={creatingId === t.id}
                  className="bg-purple-700 hover:bg-purple-800 text-white"
                >
                  {creatingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Select"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}