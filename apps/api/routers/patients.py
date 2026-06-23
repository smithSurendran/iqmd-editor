from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from core.deps import get_current_user, require_admin
from models.user import User
from schemas.patient import (
    PatientCreate, PatientUpdate, PatientOut, PatientDetail,
    PatientListResponse, PatientListItem,
    MedicationCreate, MedicationUpdate, MedicationOut,
    VisitHistoryItem,
)
from schemas.auth import SuccessResponse
import services.patient_service as svc

router = APIRouter(prefix="/patients", tags=["patients"])

# -- Patient  list & Create --
@router.get("", response_model=PatientListResponse)
def list_patients(
    search: Optional[str] = Query(None),
    focus: Optional[str]  = Query(None),
    page: int             = Query(1, ge=1),
    limit: int            = Query(20, ge=1, le=100),
    db: Session           = Depends(get_db),
    _: User               = Depends(get_current_user),
):
    result = svc.list_patients(db, search=search, focus=focus, page=page, limit=limit)
    return PatientListResponse(
        patients=[PatientListItem.model_validate(p) for p in result["patients"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )

@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    body: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = svc.create_patient(db, body, created_by=current_user.id)
    return PatientOut.model_validate(patient)

# Single Patient Endpoints (Get, Update, Archive)
@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    patient = svc.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    medications =  svc.list_medications(db, patient_id)
    visit_history = svc.get_visit_history(db, patient_id)

    out = PatientDetail.model_validate(patient)
    out.medications = [MedicationOut.model_validate(med) for med in medications]
    out.visit_history = [VisitHistoryItem.model_validate(v) for v in visit_history]

    return out

@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    patient = svc.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    updated = svc.update_patient(db, patient, body)
    return PatientOut.model_validate(updated)

@router.delete("/{patient_id}", response_model=PatientOut)
def archive_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    patient = svc.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return PatientOut.model_validate(svc.archive_patient(db, patient))

# Medications
@router.get("/{patient_id}/medications", response_model=list[MedicationOut])
def list_medications(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not svc.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    return [MedicationOut.model_validate(m) for m in svc.list_medications(db, patient_id)]

@router.post("/{patient_id}/medications", response_model=MedicationOut, status_code=status.HTTP_201_CREATED)
def create_medication(
    patient_id: str,
    body: MedicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not svc.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    medication = svc.create_medication(db, patient_id, body)
    return MedicationOut.model_validate(medication)

@router.patch("/{patient_id}/medications/{med_id}", response_model=MedicationOut)
def update_medication(
    patient_id: str,
    med_id: str,
    body: MedicationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    med = svc.get_medication(db, med_id, patient_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    return MedicationOut.model_validate(svc.update_medication(db, med, body))

@router.delete("/{patient_id}/medications/{med_id}", response_model=SuccessResponse)
def delete_medication(
    patient_id: str,
    med_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    med = svc.get_medication(db, med_id, patient_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    svc.delete_medication(db, med)
    return SuccessResponse(success=True)

# -- Visit History would be read-only, so no create/update/delete endpoints for now.
@router.get("/{patient_id}/visit-history", response_model=list[VisitHistoryItem])
def get_visit_history(
    patient_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not svc.get_patient(db, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    visit_history = svc.get_visit_history(db, patient_id)
    return [VisitHistoryItem.model_validate(v) for v in visit_history]
