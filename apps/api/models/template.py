import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, Integer, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from .patient import PrimaryFocus
import enum

class FieldType(str, enum.Enum):
    rich_text = "rich_text"
    supplement_table = "supplement_table"
    auto_fill = "auto_fill"
    locked_table = "locked_table"

class VersionTarget(str, enum.Enum):
    physician = "physician"
    patient = "patient"
    both = "both"

class Template(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    focus_category: Mapped[PrimaryFocus] = mapped_column(SAEnum(PrimaryFocus), default=PrimaryFocus.general)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    sections: Mapped[list["TemplateSection"]] = relationship("TemplateSection", back_populates="template", order_by="TemplateSection.order_index", cascade="all, delete-orphan")

class TemplateSection(Base):
    __tablename__ = "template_sections"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id: Mapped[str] = mapped_column(String, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    section_key: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    version_target: Mapped[VersionTarget] = mapped_column(SAEnum(VersionTarget), nullable=False)
    field_type: Mapped[FieldType] = mapped_column(SAEnum(FieldType), nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    placeholder: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_prompt_hint: Mapped[str | None] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship("Template", back_populates="sections")