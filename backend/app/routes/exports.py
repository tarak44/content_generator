from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from app import models, dependencies
from app.utils import export_utils

router = APIRouter()

# Export Prompts (JSON)
@router.get("/exports/prompts/")
def export_prompts(
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    prompts = db.query(models.Prompt).filter(models.Prompt.owner_id == current_user.id).all()
    export_data = [{"id": p.id, "text": p.text} for p in prompts]
    return JSONResponse(content=export_data)

# Export Templates (JSON)
@router.get("/exports/templates/")
def export_templates(
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    templates = db.query(models.Template).filter(models.Template.owner_id == current_user.id).all()
    export_data = [{"id": t.id, "name": t.name, "prompt_text": t.prompt_text} for t in templates]
    return JSONResponse(content=export_data)

# Export Generated Content (File)
@router.get("/exports/content/{content_id}")
def export_content(
    content_id: int,
    format: str,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    content_entry = db.query(models.GeneratedContent).filter(
        models.GeneratedContent.id == content_id,
        models.GeneratedContent.owner_id == current_user.id
    ).first()

    if not content_entry:
        raise HTTPException(status_code=404, detail="Content not found")

    content = content_entry.text
    filename = f"content_{content_id}.{format.lower()}"

    if format == "pdf":
        file_bytes = export_utils.generate_pdf(content)
        media_type = "application/pdf"
    elif format == "docx":
        file_bytes = export_utils.generate_docx(content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format == "text":
        file_bytes = export_utils.generate_txt(content)
        media_type = "text/plain"
    elif format == "html":
        file_bytes = export_utils.generate_html(content)
        media_type = "text/html"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    # Log analytics
    analytics_entry = models.Analytics(
        event_type="export",
        details=f"Exported content ID {content_id} as {format}",
        owner_id=current_user.id
    )
    db.add(analytics_entry)
    db.commit()

    # ✅ return inside the function
    return StreamingResponse(BytesIO(file_bytes), media_type=media_type, headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })


