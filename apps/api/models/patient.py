import uuid
from datetime import datetime, date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Date, DateTime, ForeignKey, Text, Enum as SAEnum
from .base import Base
import enum

class PrimaryFocus(str, enum.Enum):
    hormones = "hormones"
    metabolic = "metabolic"
    thyroid = "thyroid"
    fertility = "fertility"
    genomics = "genomics"
    general = "general"

class Sex(str, enum.Enum):
    male = "male"
    female = "female"
    other= "other"

class MedicationCategory(str, enum.Enum):
    medication = "medication"
    hormone = "hormone"
    peptide = "peptide"
    iv = "iv"
    supplement = "supplement"

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[Sex] = mapped_column(SAEnum(Sex), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    primary_focus: Mapped[PrimaryFocus] = mapped_column(SAEnum(PrimaryFocus), default=PrimaryFocus.general)
    symptoms_goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevant_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    medications: Mapped[list["PatientMedication"]] = relationship("PatientMedication", back_populates="patient", cascade="all, delete-orphan")

class PatientMedication(Base):
    __tablename__ = "patient_medications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[MedicationCategory] = mapped_column(SAEnum(MedicationCategory), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dose: Mapped[str | None] = mapped_column(String(100), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="medications")

