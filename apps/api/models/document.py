import uuid
from datetime import datetime, date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Date, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base
import enum

class DocumentStatus(str, enum.Enum):
    draft = "draft"
    final = "final"

class SaveReason(str, enum.Enum):
    auto_save = "auto_save"
    manual_save = "manual_save"
    export = "export"

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String, ForeignKey("patients.id"), nullable=False)
    template_id: Mapped[str] = mapped_column(String, ForeignKey("templates.id"), nullable=False)
    template_version: Mapped[str] = mapped_column(String(20), nullable=False)
    physician_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.draft)
    sections_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    supplement_rows: Mapped[list] = mapped_column(JSONB, default=list)
    header_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    versions: Mapped[list["DocumentVersion"]] = relationship("DocumentVersion", back_populates="document", order_by="DocumentVersion.version_number", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sections_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    supplement_rows: Mapped[list] = mapped_column(JSONB, default=list)
    header_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    saved_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    save_reason: Mapped[SaveReason] = mapped_column(SAEnum(SaveReason), default=SaveReason.manual_save)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    document: Mapped["Document"] = relationship("Document", back_populates="versions")