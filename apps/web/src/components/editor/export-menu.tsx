"use client";

import { useState } from "react";
import { Download, FileText, FileType, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { exportApi } from "@/lib/api-client";
import { toast } from "sonner";

export function ExportMenu({ documentId }: { documentId: string }) {
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  const handleExport = async (fmt: "docx" | "pdf") => {
    setExporting(fmt);
    try {
      if (fmt === "docx") await exportApi.downloadDocx(documentId);
      else await exportApi.downloadPdf(documentId);
      toast.success(`Exported as ${fmt.toUpperCase()}`);
    } catch {
      toast.error(`Failed to export ${fmt.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={!!exporting}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("docx")}>
          <FileText className="w-4 h-4 mr-2" /> Export as Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileType className="w-4 h-4 mr-2" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}