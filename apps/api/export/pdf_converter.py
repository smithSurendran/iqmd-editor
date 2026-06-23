import subprocess
import tempfile
from pathlib import Path
from core.config import settings


def convert_docx_to_pdf(docx_bytes: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        docx_path = Path(tmp) / "document.docx"
        docx_path.write_bytes(docx_bytes)

        result = subprocess.run(
            [
                settings.LIBREOFFICE_PATH,
                "--headless",
                "--convert-to", "pdf",
                "--outdir", tmp,
                str(docx_path),
            ],
            capture_output=True,
            timeout=30,
        )

        pdf_path = Path(tmp) / "document.pdf"
        if not pdf_path.exists():
            raise RuntimeError(
                f"LibreOffice conversion failed: {result.stderr.decode(errors='ignore')}"
            )
        return pdf_path.read_bytes()