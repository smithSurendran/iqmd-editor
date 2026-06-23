"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import {
  documentApi,
  HeaderData,
  patientApi,
  templateApi,
  TemplateSection,
} from "@/lib/api-client";
import { useDocumentStore } from "@/store/document-store";
import { AutoSaveIndicator } from "@/components/editor/autosave-indicator";
import { ExportMenu } from "@/components/editor/export-menu";
import { MembershipSection } from "@/components/editor/membership-section";
import { PatientHeader } from "@/components/editor/patient-header";
import { SectionEditor } from "@/components/editor/section-editor";
import { SupplementTable } from "@/components/editor/supplement-table";
import { VersionHistoryPanel } from "@/components/editor/version-history-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AUTOSAVE_INTERVAL_MS = 30000;

export default function EditorPage() {
  const { docId } = useParams<{ docId: string }>();
  const router = useRouter();

  const {
    document,
    sections,
    sectionsData,
    supplementRows,
    headerData,
    activeTab,
    isDirty,
    isSaving,
    lastSavedAt,
    init,
    setSectionContent,
    setSupplementRows,
    setHeaderData,
    setActiveTab,
    markSaving,
    markSaved,
    reset,
    setDocumentStatus,
  } = useDocumentStore();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const doc = await documentApi.get(docId);
        const tmpl = await templateApi.get(doc.template_id);
        const patient = await patientApi.get(doc.patient_id);
        init(doc, tmpl.sections ?? []);
        setPatientName(`${patient.first_name} ${patient.last_name}`);
        setTemplateName(tmpl.name);
      } catch {
        toast.error("Failed to load document");
        router.push("/patients");
      } finally {
        setLoading(false);
      }
    })();

    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const save = useCallback(async (
    reason: "auto_save" | "manual_save" = "auto_save",
    statusOverride?: "draft" | "final",
  ) => {
    if (!document || !headerData) return;

    markSaving(true);
    try {
      const saved = await documentApi.save(document.id, {
        sections_data: sectionsData,
        supplement_rows: supplementRows,
        header_data: headerData,
        save_reason: reason,
        ...(statusOverride ? { status: statusOverride } : {}),
      });
      markSaved();
      setSaveError(false);
      if (statusOverride) setDocumentStatus(saved.status);
    } catch {
      setSaveError(true);
      markSaving(false);
      toast.error("Failed to save - will retry");
    }
  }, [
    document,
    headerData,
    markSaved,
    markSaving,
    sectionsData,
    setDocumentStatus,
    supplementRows,
  ]);

  const handleRestored = useCallback(async () => {
    try {
      const doc = await documentApi.get(docId);
      const tmpl = await templateApi.get(doc.template_id);
      init(doc, tmpl.sections ?? []);
      toast.success("Editor reloaded with restored content");
    } catch {
      toast.error("Failed to reload after restore");
    }
  }, [docId, init]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) save("auto_save");
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isDirty, save]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (loading || !document || !headerData) {
    return (
      <div className="max-w-4xl space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const physicianSections = sections
    .filter((section) => section.section_key === "header" || section.version_target === "physician")
    .sort((a, b) => a.order_index - b.order_index);

  const patientSections = sections
    .filter((section) => section.section_key === "patient_header" || section.version_target === "patient")
    .sort((a, b) => a.order_index - b.order_index);

  const renderSection = (section: TemplateSection) => {
    if (section.field_type === "auto_fill") {
      return (
        <PatientHeader
          key={section.id}
          data={headerData}
          onChange={(data: HeaderData) => setHeaderData(data)}
        />
      );
    }

    return (
      <SectionEditor
        key={section.id}
        sectionKey={section.section_key}
        displayName={section.display_name}
        placeholder={section.placeholder}
        content={sectionsData[section.section_key]}
        onChange={setSectionContent}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/patients/${document.patient_id}`}
              className={buttonVariants({
                size: "icon",
                variant: "ghost",
                className: "h-8 w-8 shrink-0",
              })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900">{patientName}</h1>
              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                <FileText className="h-3 w-3 shrink-0" />
                {templateName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AutoSaveIndicator
              isDirty={isDirty}
              isSaving={isSaving}
              lastSavedAt={lastSavedAt}
              error={saveError}
            />

            {document.status === "draft" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => save("manual_save", "final")}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Mark as Final
              </Button>
            ) : (
              <Badge className="border-0 bg-green-100 text-green-700">Final</Badge>
            )}

            <VersionHistoryPanel documentId={document.id} onRestored={handleRestored} />
            <ExportMenu documentId={document.id} />

            <Button
              size="sm"
              onClick={() => save("manual_save")}
              disabled={isSaving}
              className="bg-purple-700 text-white hover:bg-purple-800"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "physician" | "patient")}
          className="flex flex-col gap-4"
        >
          <TabsList className="mb-0 w-fit">
            <TabsTrigger value="physician">Physician Version</TabsTrigger>
            <TabsTrigger value="patient">Patient Version</TabsTrigger>
          </TabsList>

          <TabsContent value="physician" className="space-y-4">
            {physicianSections.map(renderSection)}
          </TabsContent>

          <TabsContent value="patient" className="space-y-4">
            {patientSections.map(renderSection)}
          </TabsContent>
        </Tabs>

        <div className="space-y-4 border-t border-slate-200 pt-2">
          <SupplementTable rows={supplementRows} onChange={setSupplementRows} />
          <MembershipSection />
        </div>
      </div>
    </div>
  );
}
