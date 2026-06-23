from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime
from models.patient import PrimaryFocus, Sex, MedicationCategory

class MedicationCreate(BaseModel):
    category: MedicationCategory
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None
    is_current: bool = True

class MedicationUpdate(BaseModel):
    category: Optional[MedicationCategory] = None
    name: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None
    is_current: Optional[bool] = None

class MedicationOut(BaseModel):
    id: str
    patient_id: str
    category: MedicationCategory
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None
    is_current: bool
    created_at: datetime

    class Config:
        from_attributes = True
# -- Patient Schemas --
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: date
    sex: Sex
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_focus: PrimaryFocus = PrimaryFocus.general
    symptoms_goals: Optional[str] = None
    relevant_history: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[date] = None
    sex: Optional[Sex] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_focus: Optional[PrimaryFocus] = None
    symptoms_goals: Optional[str] = None
    relevant_history: Optional[str] = None

class VisitHistoryItem(BaseModel):
    id: str
    visit_date: date
    template_name: Optional[str] = None
    physician_name: Optional[str] = None
    status:str
    created_at: datetime

class PatientOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    dob: date
    sex: Sex
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_focus: PrimaryFocus
    symptoms_goals: Optional[str] = None
    relevant_history: Optional[str] = None
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


    class Config:
        from_attributes = True

class PatientDetail(PatientOut):
    medications: list[MedicationOut] = Field(default_factory=list)
    visit_history: list[VisitHistoryItem] = Field(default_factory=list)

class PatientListItem(BaseModel):
    id: str
    first_name: str
    last_name: str
    dob: date
    sex: Sex
    primary_focus: PrimaryFocus
    email: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientListResponse(BaseModel):
    patients: list[PatientListItem]
    total: int
    page:int
    limit:int
    total_pages:int
