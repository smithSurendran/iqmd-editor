"use client";

import { useEffect, useState } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { documentApi, DocumentVersion } from "@/lib/api-client";
import { extractPlainText } from "@/lib/text-extract";

interface VersionHistoryPanelProps {
  documentId: string;
  onRestored: () => void;
}

export function VersionHistoryPanel({ documentId, onRestored }: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState<DocumentVersion | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const nextVersions = await documentApi.listVersions(documentId);
        if (!cancelled) setVersions(nextVersions);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, documentId]);

  const handlePreview = async (version: DocumentVersion) => {
    const full = await documentApi.getVersion(documentId, version.version_number);
    setPreviewing(full);
  };

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber);
    try {
      await documentApi.restore(documentId, versionNumber);
      toast.success(`Restored version ${versionNumber}`);
      setOpen(false);
      setPreviewing(null);
      onRestored();
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <History className="mr-1.5 h-3.5 w-3.5" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] overflow-y-auto sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>

        {previewing ? (
          <div className="mt-4">
            <Button size="sm" variant="ghost" onClick={() => setPreviewing(null)} className="mb-3">
              Back to list
            </Button>
            <p className="mb-3 text-xs text-slate-400">
              Version {previewing.version_number} - {new Date(previewing.created_at).toLocaleString()}
            </p>
            <div className="space-y-3">
              {previewing.sections_data &&
                Object.entries(previewing.sections_data).map(([key, content]) => (
                  <div key={key} className="rounded-lg border border-slate-100 p-3">
                    <p className="mb-1 text-xs font-semibold text-slate-700">{key}</p>
                    <p className="whitespace-pre-wrap text-xs text-slate-500">
                      {extractPlainText(content) || "-"}
                    </p>
                  </div>
                ))}
              {previewing.supplement_rows && previewing.supplement_rows.length > 0 && (
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-700">Supplements</p>
                  {previewing.supplement_rows.map((row) => (
                    <p key={row.id} className="text-xs text-slate-500">
                      {row.name} - {row.dose}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="mt-4 w-full bg-purple-700 text-white hover:bg-purple-800"
              onClick={() => handleRestore(previewing.version_number)}
              disabled={restoring === previewing.version_number}
            >
              {restoring === previewing.version_number ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restore this version
            </Button>
          </div>
        ) : loading ? (
          <p className="mt-6 text-center text-sm text-slate-400">Loading...</p>
        ) : versions.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">No versions yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => handlePreview(version)}
                className="w-full rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">Version {version.version_number}</p>
                  <span className="text-[10px] uppercase text-slate-400">
                    {version.save_reason.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(version.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
