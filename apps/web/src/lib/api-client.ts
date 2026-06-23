import api from "./api";

// Types --
export type UserRole = "physician" | "admin" | "staff";

export interface User {
    id: number;
    email: string;
    role: UserRole;
    first_name: string;
    last_name: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

//Auth Interceptors --
export const authApi = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const {data} = await api.post("/auth/login", { email, password });
        return data;
},
    logout: async () => {
        await api.post("/auth/logout");
    },
    me: async (): Promise<User> => {
        const {data} = await api.get("/auth/me");
        return data;
    },
    resetRequest: async (email: string) => {
        const {data} = await api.post("/auth/reset-password", { email });
        return data;
    },
};

// --Patients--
export type PrimaryFocus = "hormones" | "metabolic" | "thyroid" | "fertility" | "genomics" | "general";

export type Sex ="male" | "female" | "other"
export type MedicationCategory = | "medication" | "hormone" | "peptide" | "iv" | "supplement"

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: Sex;
  email?: string;
  phone?: string;
  primary_focus: PrimaryFocus;
  symptoms_goals?: string;
  relevant_history?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  category: MedicationCategory;
  name: string;
  dose?: string;
  frequency?: string;
  start_date?: string;
  notes?: string;
  is_current: boolean;
  created_at: string;
}

export interface VisitHistoryItem {
  id: string;
  visit_date: string;
  template_name: string;
  physician_name: string;
  status: string;
  created_at: string;
}

export interface PatientDetail extends Patient {
  medications: Medication[];
  visit_history: VisitHistoryItem[];
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
export const patientApi = {
    list: async (params?: {
        search?: string;
        focus?: string;
        page?: number;
        limit?: number;
    }): Promise<PatientListResponse> => {
        const {data} = await api.get("/patients", { params});
        return data;
    },
    get: async (id: string): Promise<PatientDetail> => {
        const {data} = await api.get(`/patients/${id}`);
        return data;
    },
    create: async (body: Partial<Patient>): Promise<Patient> => {
        const{data} = await api.post("/patients", body);
        return data;
    },
    update: async(id: string, body: Partial<Patient>): Promise<Patient> => {
        const {data} = await api.patch(`/patients/${id}`, body);
        return data;
    },
    createMedication: async (
        patientId: string,
        body: Partial<Medication> 
    ): Promise<Medication> =>{
        const {data} = await api.post(`/patients/${patientId}/medications`, body);
        return data;
    },
    updateMedication: async(
        patientId: string,
        medId: string,
        body: Partial<Medication>
    ):Promise<Medication> => {
        const {data} = await api.patch(`/patients/${patientId}/medications/${medId}`, body);
        return data;
    },
    deleteMedication: async(patientId: string, medId: string): Promise<{ success: boolean }> => {
        const {data} = await api.delete(`/patients/${patientId}/medications/${medId}`);
        return data;
    },
};

//Template --

export type FieldType =
  | "rich_text" | "supplement_table" | "auto_fill" | "locked_table";
export type VersionTarget = "physician" | "patient" | "both";

export interface TemplateSection {
  id: string;
  order_index: number;
  section_key: string;
  display_name: string;
  version_target: VersionTarget;
  field_type: FieldType;
  is_locked: boolean;
  placeholder?: string;
}

export interface Template {
  id: string;
  name: string;
  focus_category: PrimaryFocus;
  version: string;
  is_locked: boolean;
  is_system: boolean;
  description?: string;
  sections?: TemplateSection[];
}

export const templateApi = {
  list: async (focus_category?: string): Promise<Template[]> => {
    const { data } = await api.get("/templates", {
      params: focus_category ? { focus_category } : {},
    });
    return data;
  },
  get: async (id: string): Promise<Template> => {
    const { data } = await api.get(`/templates/${id}`);
    return data;
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────
export interface SupplementRow {
  id: string;
  name: string;
  dose: string;
  timing: string;
  purpose: string;
}

export interface HeaderData {
  patient_name: string;
  dob: string;
  visit_date: string;
  primary_focus: string;
  current_regimen: string;
  compared_to: string;
  protocol_prepared_by: string;
  source_documents: string;
}

export interface Document {
  id: string;
  patient_id: string;
  template_id: string;
  template_version: string;
  physician_id: string;
  visit_date: string;
  status: "draft" | "final";
  sections_data: Record<string, unknown>;
  supplement_rows: SupplementRow[];
  header_data: HeaderData;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  saved_by: string;
  save_reason: string;
  created_at: string;
  sections_data?: Record<string, unknown>;
  supplement_rows?: SupplementRow[];
  header_data?: HeaderData;
}

export const documentApi = {
  create: async (body: {
    patient_id: string;
    template_id: string;
    visit_date: string;
  }): Promise<Document> => {
    const { data } = await api.post("/documents", body);
    return data;
  },
  get: async (id: string): Promise<Document> => {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },
  save: async (
    id: string,
    body: {
      sections_data?: Record<string, unknown>;
      supplement_rows?: SupplementRow[];
      header_data?: HeaderData;
      status?: "draft" | "final";
      save_reason?: "auto_save" | "manual_save" | "export";
    }
  ): Promise<Document> => {
    const { data } = await api.patch(`/documents/${id}`, body);
    return data;
  },
  listVersions: async (id: string): Promise<DocumentVersion[]> => {
    const { data } = await api.get(`/documents/${id}/versions`);
    return data;
  },
  getVersion: async (
    id: string,
    versionNumber: number
  ): Promise<DocumentVersion> => {
    const { data } = await api.get(`/documents/${id}/versions/${versionNumber}`);
    return data;
  },
  restore: async (id: string, versionNumber: number): Promise<Document> => {
    const { data } = await api.post(`/documents/${id}/restore/${versionNumber}`);
    return data;
  },
  listForPatient: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}/documents`);
    return data;
  },
};

function getFilenameFromDisposition(disposition?: string, fallback = "document"): string {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const exportApi = {
  downloadDocx: async (id: string) => {
    const res = await api.post(`/documents/${id}/export/docx`, null, { responseType: "blob" });
    triggerDownload(res.data, getFilenameFromDisposition(res.headers["content-disposition"], "protocol.docx"));
  },
  downloadPdf: async (id: string) => {
    const res = await api.post(`/documents/${id}/export/pdf`, null, { responseType: "blob" });
    triggerDownload(res.data, getFilenameFromDisposition(res.headers["content-disposition"], "protocol.pdf"));
  },
};
