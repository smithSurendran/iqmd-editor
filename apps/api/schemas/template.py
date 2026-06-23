from pydantic import BaseModel, Field
from typing import Optional
from models.template import FieldType, VersionTarget
from models.patient import PrimaryFocus

class TemplateSectionOut(BaseModel):
    id: str
    order_index: int
    section_key: str
    display_name: str
    version_target: VersionTarget
    field_type: FieldType
    is_locked: bool
    placeholder: Optional[str]
    ai_prompt_hint: Optional[str]

    class Config:
        from_attributes = True

class TemplateOut(BaseModel):
    id: str
    name:str
    focus_category: PrimaryFocus
    version: str
    is_locked: bool
    is_system: bool
    description: Optional[str]
    
    class Config:
        from_attributes = True
        
class TemplateDetail(TemplateOut):
    sections: list[TemplateSectionOut] = Field(default_factory=list)
