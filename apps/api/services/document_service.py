from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone, date
from models.document import Document, DocumentVersion, DocumentStatus, SaveReason
from models.template import Template
from models.patient import Patient
from models.user import User
from schemas.document import DocumentCreate, DocumentUpdate
import uuid


def _build_initial_header(patient: Patient, visit_date: date) -> dict:
    """Pre-populate header from patient record."""
    return {
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "dob": patient.dob.strftime("%m/%d/%Y"),
        "visit_date": visit_date.strftime("%m/%d/%Y"),
        "primary_focus": patient.primary_focus.value.title(),
        "current_regimen": "",
        "compared_to": "",
        "protocol_prepared_by": "IQMD",
        "source_documents": "",
    }


def _snapshot(db: Session, doc: Document, reason: SaveReason, saved_by: str) -> DocumentVersion:
    """Create a version snapshot of current document state."""
    version = DocumentVersion(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        version_number=doc.current_version,
        sections_data=dict(doc.sections_data),
        supplement_rows=list(doc.supplement_rows),
        header_data=dict(doc.header_data),
        saved_by=saved_by,
        save_reason=reason,
    )
    db.add(version)
    return version


# ── Create ────────────────────────────────────────────────────────────────────
def create_document(
    db: Session, data: DocumentCreate, physician_id: str
) -> Document:
    template = db.query(Template).filter(Template.id == data.template_id).first()
    patient  = db.query(Patient).filter(Patient.id == data.patient_id).first()

    if not template:
        raise ValueError("Template not found")
    if not patient:
        raise ValueError("Patient not found")

    doc = Document(
        id=str(uuid.uuid4()),
        patient_id=data.patient_id,
        template_id=data.template_id,
        template_version=template.version,
        physician_id=physician_id,
        visit_date=data.visit_date,
        status=DocumentStatus.draft,
        sections_data={},
        supplement_rows=[],
        header_data=_build_initial_header(patient, data.visit_date),
        current_version=1,
    )
    db.add(doc)
    db.flush()

    # Create first version snapshot
    _snapshot(db, doc, SaveReason.manual_save, physician_id)
    db.commit()
    db.refresh(doc)
    return doc


# ── Read ──────────────────────────────────────────────────────────────────────
def get_document(db: Session, doc_id: str) -> Optional[Document]:
    return db.query(Document).filter(
        Document.id == doc_id,
        Document.archived_at.is_(None),
    ).first()


def list_patient_documents(db: Session, patient_id: str) -> list[dict]:
    docs = (
        db.query(Document)
        .filter(
            Document.patient_id == patient_id,
            Document.archived_at.is_(None),
        )
        .order_by(Document.visit_date.desc())
        .all()
    )
    result = []
    for doc in docs:
        template  = db.query(Template).filter(Template.id == doc.template_id).first()
        physician = db.query(User).filter(User.id == doc.physician_id).first()
        result.append({
            "id": doc.id,
            "visit_date": doc.visit_date,
            "template_name": template.name if template else "Unknown",
            "physician_name": f"{physician.first_name} {physician.last_name}" if physician else "Unknown",
            "status": doc.status,
            "current_version": doc.current_version,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
        })
    return result


# ── Save (PATCH) ──────────────────────────────────────────────────────────────
def save_document(
    db: Session, doc: Document, data: DocumentUpdate, saved_by: str
) -> Document:
    if data.sections_data is not None:
        doc.sections_data = data.sections_data

    if data.supplement_rows is not None:
        doc.supplement_rows = [r.model_dump() for r in data.supplement_rows]

    if data.header_data is not None:
        doc.header_data = data.header_data.model_dump()

    if data.status is not None:
        doc.status = data.status

    doc.current_version += 1
    doc.updated_at = datetime.now(timezone.utc)

    _snapshot(db, doc, data.save_reason, saved_by)
    db.commit()
    db.refresh(doc)
    return doc


# ── Version history ───────────────────────────────────────────────────────────
def list_versions(db: Session, doc_id: str) -> list[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == doc_id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )


def get_version(
    db: Session, doc_id: str, version_number: int
) -> Optional[DocumentVersion]:
    return db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc_id,
        DocumentVersion.version_number == version_number,
    ).first()


# ── Restore ───────────────────────────────────────────────────────────────────
def restore_version(
    db: Session, doc: Document, version_number: int, restored_by: str
) -> Document:
    snapshot = get_version(db, doc.id, version_number)
    if not snapshot:
        raise ValueError(f"Version {version_number} not found")

    doc.sections_data   = dict(snapshot.sections_data)
    doc.supplement_rows = list(snapshot.supplement_rows)
    doc.header_data     = dict(snapshot.header_data)
    doc.current_version += 1
    doc.updated_at = datetime.now(timezone.utc)

    _snapshot(db, doc, SaveReason.manual_save, restored_by)
    db.commit()
    db.refresh(doc)
    return doc