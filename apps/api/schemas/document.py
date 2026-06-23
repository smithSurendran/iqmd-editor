from pydantic import BaseModel
from typing import Optional, Any
from datetime import date, datetime
from models.document import DocumentStatus, SaveReason


# ── Supplement row ────────────────────────────────────────────────────────────
class SupplementRow(BaseModel):
    id: str
    name: str
    dose: str = ""
    timing: str = ""
    purpose: str = ""


# ── Header data ───────────────────────────────────────────────────────────────
class HeaderData(BaseModel):
    patient_name: str = ""
    dob: str = ""
    visit_date: str = ""
    primary_focus: str = ""
    current_regimen: str = ""
    compared_to: str = ""
    protocol_prepared_by: str = "IQMD"
    source_documents: str = ""


# ── Document create ───────────────────────────────────────────────────────────
class DocumentCreate(BaseModel):
    patient_id: str
    template_id: str
    visit_date: date


# ── Document update (save / auto-save) ───────────────────────────────────────
class DocumentUpdate(BaseModel):
    sections_data: Optional[dict[str, Any]] = None
    supplement_rows: Optional[list[SupplementRow]] = None
    header_data: Optional[HeaderData] = None
    status: Optional[DocumentStatus] = None
    save_reason: SaveReason = SaveReason.auto_save


# ── Version output ────────────────────────────────────────────────────────────
class DocumentVersionOut(BaseModel):
    id: str
    version_number: int
    saved_by: str
    save_reason: SaveReason
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentVersionDetail(DocumentVersionOut):
    sections_data: dict
    supplement_rows: list
    header_data: dict


# ── Document output ───────────────────────────────────────────────────────────
class DocumentOut(BaseModel):
    id: str
    patient_id: str
    template_id: str
    template_version: str
    physician_id: str
    visit_date: date
    status: DocumentStatus
    sections_data: dict
    supplement_rows: list
    header_data: dict
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Visit list item (for patient history) ────────────────────────────────────
class DocumentListItem(BaseModel):
    id: str
    visit_date: date
    template_name: str
    physician_name: str
    status: DocumentStatus
    current_version: int
    created_at: datetime
    updated_at: datetime