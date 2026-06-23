from sqlalchemy.orm import Session
from typing import Literal
from models.patient import Patient
import services.template_service as template_svc
import services.document_service as doc_svc
from export.docx_builder import build_protocol_docx
from export.pdf_converter import convert_docx_to_pdf


def _split_sections(sections):
    physician = sorted(
        [s for s in sections if s.section_key == "header" or s.version_target.value == "physician"],
        key=lambda s: s.order_index,
    )
    patient = sorted(
        [s for s in sections if s.section_key == "patient_header" or s.version_target.value == "patient"],
        key=lambda s: s.order_index,
    )
    return physician, patient


def export_document(db: Session, doc_id: str, fmt: Literal["docx", "pdf"]) -> tuple[bytes, str]:
    document = doc_svc.get_document(db, doc_id)
    if not document:
        raise ValueError("Document not found")

    patient = db.query(Patient).filter(Patient.id == document.patient_id).first()
    sections = template_svc.get_template_sections(db, document.template_id)
    physician_sections, patient_sections = _split_sections(sections)

    docx_bytes = build_protocol_docx(
        document=document,
        physician_sections=physician_sections,
        patient_sections=patient_sections,
        supplement_rows=document.supplement_rows,
        header_data=document.header_data,
    )

    last_name = patient.last_name if patient else "Patient"
    filename_base = f"{last_name}_{document.visit_date}_IQMD"

    if fmt == "docx":
        return docx_bytes, f"{filename_base}.docx"

    pdf_bytes = convert_docx_to_pdf(docx_bytes)
    return pdf_bytes, f"{filename_base}.pdf"