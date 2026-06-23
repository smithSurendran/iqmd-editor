from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from core.database import get_db
from core.deps import get_current_user
from models.user import User
from export import export_service as svc

router = APIRouter(prefix="/documents", tags=["export"])

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_MIME = "application/pdf"


@router.post("/{doc_id}/export/docx")
def export_docx(doc_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        data, filename = svc.export_document(db, doc_id, "docx")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return StreamingResponse(
        BytesIO(data), media_type=DOCX_MIME,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{doc_id}/export/pdf")
def export_pdf(doc_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        data, filename = svc.export_document(db, doc_id, "pdf")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {e}")
    return StreamingResponse(
        BytesIO(data), media_type=PDF_MIME,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
