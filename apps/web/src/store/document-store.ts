import { create } from "zustand";
import type { JSONContent } from "@tiptap/core";
import { Document, TemplateSection, SupplementRow, HeaderData } from "@/lib/api-client";

interface DocumentState {
  document: Document | null;
  sections: TemplateSection[];
  sectionsData: Record<string, JSONContent>;
  supplementRows: SupplementRow[];
  headerData: HeaderData | null;
  activeTab: "physician" | "patient";
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  init: (document: Document, sections: TemplateSection[]) => void;
  setSectionContent: (key: string, content: JSONContent) => void;
  setSupplementRows: (rows: SupplementRow[]) => void;
  setHeaderData: (data: HeaderData) => void;
  setActiveTab: (tab: "physician" | "patient") => void;
  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
  setDocumentStatus: (status: "draft" | "final") => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  sections: [],
  sectionsData: {},
  supplementRows: [],
  headerData: null,
  activeTab: "physician",
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  init: (document, sections) =>
    set({
      document,
      sections,
      sectionsData: (document.sections_data || {}) as Record<string, JSONContent>,
      supplementRows: document.supplement_rows || [],
      headerData: document.header_data,
      isDirty: false,
      isSaving: false,
      lastSavedAt: new Date(document.updated_at),
    }),

  setSectionContent: (key, content) =>
    set((state) => ({
      sectionsData: { ...state.sectionsData, [key]: content },
      isDirty: true,
    })),

  setDocumentStatus: (status) =>
    set((state) => ({
      document: state.document ? { ...state.document, status } : state.document,
    })),
  setSupplementRows: (rows) => set({ supplementRows: rows, isDirty: true }),

  setHeaderData: (data) => set({ headerData: data, isDirty: true }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  markSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => set({ isDirty: false, isSaving: false, lastSavedAt: new Date() }),

  reset: () =>
    set({
      document: null,
      sections: [],
      sectionsData: {},
      supplementRows: [],
      headerData: null,
      activeTab: "physician",
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
    }),
}));
