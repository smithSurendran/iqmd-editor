from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from schemas.template import TemplateOut, TemplateDetail, TemplateSectionOut
import services.template_service as svc

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateOut])
def list_templates(
    focus_category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [TemplateOut.model_validate(t) for t in svc.list_templates(db, focus_category)]


@router.get("/{template_id}", response_model=TemplateDetail)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    template = svc.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    sections = svc.get_template_sections(db, template_id)
    out = TemplateDetail.model_validate(template)
    out.sections = [TemplateSectionOut.model_validate(s) for s in sections]
    return out


@router.get("/{template_id}/sections", response_model=list[TemplateSectionOut])
def get_template_sections(
    template_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    template = svc.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    sections = svc.get_template_sections(db, template_id)
    return [TemplateSectionOut.model_validate(s) for s in sections]