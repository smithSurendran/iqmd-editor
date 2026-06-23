from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from datetime import datetime, timezone
from models.patient import Patient, PatientMedication
from models.document import Document
from models.template import Template
from models.user import User
from schemas.patient import (
    PatientCreate, PatientUpdate, MedicationCreate, MedicationUpdate
)
import uuid

# -- Patient CRUD Operations --
def list_patients(db: Session, search: Optional[str] = None, focus: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
    query = db.query(Patient).filter(Patient.archived_at.is_(None))

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(or_(
            func.lower(Patient.first_name).like(term),
            func.lower(Patient.last_name).like(term),
            func.lower(func.concat(Patient.first_name, ' ', Patient.last_name)).like(term),
        ))
    if focus:
        query = query.filter(Patient.primary_focus == focus)
    total = query.count()
    patients = (
        query
        .order_by(Patient.updated_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "patients": patients,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, -(-total // limit)),
    }

def create_patient(db: Session, data: PatientCreate, created_by: str) -> Patient:
    patient = Patient(
        id=str(uuid.uuid4()),
        created_by=created_by,
        **data.model_dump()
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.id == patient_id, Patient.archived_at.is_(None)).first()

def update_patient(db: Session, patient: Patient, data: PatientUpdate) -> Optional[Patient]:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return patient

def archive_patient(db: Session, patient: Patient) -> Optional[Patient]:
    patient.archived_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return patient

# --Medication CRUD Operations--
def list_medications(db: Session, patient_id: str) -> list[PatientMedication]:
    return db.query(PatientMedication).filter(PatientMedication.patient_id == patient_id).all()

def create_medication(db: Session, patient_id: str, data: MedicationCreate) -> PatientMedication:
    medication = PatientMedication(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        **data.model_dump()
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication

def get_medication(db: Session, medication_id: str, patient_id: str) -> Optional[PatientMedication]:
    return db.query(PatientMedication).filter(PatientMedication.id == medication_id, PatientMedication.patient_id == patient_id).first()

def update_medication(db: Session, medication: PatientMedication, data: MedicationUpdate) -> Optional[PatientMedication]:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(medication, field, value)
    db.commit()
    db.refresh(medication)
    return medication

def delete_medication(db: Session, medication: PatientMedication) -> None:
    db.delete(medication)
    db.commit()

# -- Visit History --
def get_visit_history(db: Session, patient_id: str) -> list[dict]:
    docs = (
        db.query(Document)
        .filter(
            Document.patient_id == patient_id,
            Document.archived_at.is_(None)
        )
        .order_by(Document.visit_date.desc())
        .all()
    )
    history = []
    for doc in docs:
        template = db.query(Template).filter(Template.id == doc.template_id).first()
        physician = db.query(User).filter(User.id == doc.physician_id).first()
        history.append({
            "id": doc.id,
            "visit_date": doc.visit_date,
            "template_name": template.name if template else "Unknown Template",
            "physician_name": f"{physician.first_name} {physician.last_name}" if physician else "Unknown Physician",
            "status": doc.status.value,
            "created_at": doc.created_at
        })
    return history
