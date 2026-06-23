from sqlalchemy.orm import Session
from typing import Optional
from models.template import Template, TemplateSection

def list_templates(
        db: Session,
        focus_category:Optional[str] = None,

) -> list[Template]:
    query = db.query(Template)
    if focus_category:
        query = query.filter(Template.focus_category == focus_category)
    return query.order_by(Template.is_system.desc(), Template.name).all()

def get_template(db: Session, template_id: str) -> Optional[Template]:
    return db.query(Template).filter(Template.id == template_id).first()

def get_template_sections(db: Session, template_id: str) -> list[TemplateSection]:
    return (db.query(TemplateSection)
            .filter(TemplateSection.template_id == template_id)
            .order_by(TemplateSection.order_index)
            .all())