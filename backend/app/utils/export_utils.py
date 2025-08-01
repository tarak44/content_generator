import pdfkit
from docx import Document
from io import BytesIO

def generate_pdf(content: str) -> bytes:
    # Convert string content to PDF bytes
    return pdfkit.from_string(content, False)

def generate_docx(content: str) -> bytes:
    # Convert string content to DOCX bytes
    doc = Document()
    doc.add_paragraph(content)
    file_stream = BytesIO()
    doc.save(file_stream)
    return file_stream.getvalue()

def generate_text(content: str) -> bytes:
    # Convert string content to plain text bytes
    return content.encode("utf-8")

def generate_html(content: str) -> bytes:
    # Convert string content to basic HTML bytes
    html = f"<html><body>{content}</body></html>"
    return html.encode("utf-8")
