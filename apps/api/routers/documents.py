from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from schemas.document import (
    DocumentCreate, DocumentUpdate, DocumentOut,
    DocumentVersionOut, DocumentVersionDetail,
    DocumentListItem,
)
from schemas.auth import SuccessResponse
import services.document_service as svc

router = APIRouter(tags=["documents"])


# ── Create document ───────────────────────────────────────────────────────────
@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    body: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        doc = svc.create_document(db, body, physician_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return DocumentOut.model_validate(doc)


# ── Get document ──────────────────────────────────────────────────────────────
@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    doc = svc.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentOut.model_validate(doc)


# ── Save document (auto-save + manual save) ───────────────────────────────────
@router.patch("/documents/{doc_id}", response_model=DocumentOut)
def save_document(
    doc_id: str,
    body: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = svc.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = svc.save_document(db, doc, body, saved_by=current_user.id)
    return DocumentOut.model_validate(doc)


# ── Version history ───────────────────────────────────────────────────────────
@router.get("/documents/{doc_id}/versions", response_model=list[DocumentVersionOut])
def list_versions(
    doc_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    doc = svc.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return [DocumentVersionOut.model_validate(v) for v in svc.list_versions(db, doc_id)]


@router.get("/documents/{doc_id}/versions/{version_number}", response_model=DocumentVersionDetail)
def get_version(
    doc_id: str,
    version_number: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    doc = svc.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    version = svc.get_version(db, doc_id, version_number)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return DocumentVersionDetail.model_validate(version)


# ── Restore version ───────────────────────────────────────────────────────────
@router.post("/documents/{doc_id}/restore/{version_number}", response_model=DocumentOut)
def restore_version(
    doc_id: str,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = svc.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        doc = svc.restore_version(db, doc, version_number, restored_by=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return DocumentOut.model_validate(doc)


# ── Patient documents list ────────────────────────────────────────────────────
@router.get("/patients/{patient_id}/documents", response_model=list[DocumentListItem])
def list_patient_documents(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [DocumentListItem(**d) for d in svc.list_patient_documents(db, patient_id)]