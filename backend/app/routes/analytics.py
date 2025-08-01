from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, dependencies
import csv
from io import StringIO, BytesIO
from fpdf import FPDF

router = APIRouter()

@router.get("/analytics/")
def get_analytics(
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    prompt_count = db.query(models.Prompt).filter(models.Prompt.owner_id == current_user.id).count()
    template_count = db.query(models.Template).filter(models.Template.owner_id == current_user.id).count()

    export_count = db.query(models.Analytics).filter(
        models.Analytics.owner_id == current_user.id,
        models.Analytics.event_type == "export"
    ).count()

    generated_content_count = db.query(models.Analytics).filter(
        models.Analytics.owner_id == current_user.id,
        models.Analytics.event_type == "generate"
    ).count()

    user_memory_enabled = db.query(models.MemoryEmbedding).filter(
        models.MemoryEmbedding.owner_id == current_user.id
    ).count() > 0

    embeddings_active = db.query(models.MemoryEmbedding).filter(
        models.MemoryEmbedding.owner_id == current_user.id
    ).count() > 0

    # Avg. Response Time (assumes numeric 'response_time' in details or column)
    avg_response_time = db.query(func.avg(models.Analytics.response_time)).filter(
        models.Analytics.owner_id == current_user.id,
        models.Analytics.response_time != None
    ).scalar() or 0

    # Prompt Effectiveness (assumes effectiveness stored in details as a numeric field or column)
    avg_prompt_effectiveness = db.query(func.avg(models.Analytics.prompt_effectiveness)).filter(
        models.Analytics.owner_id == current_user.id,
        models.Analytics.prompt_effectiveness != None
    ).scalar() or 0

    # User Engagement (assumes engagement score or some "clicks/views/etc.")
    avg_user_engagement = db.query(func.avg(models.Analytics.engagement_score)).filter(
        models.Analytics.owner_id == current_user.id,
        models.Analytics.engagement_score != None
    ).scalar() or 0

    return {
        "prompt_count": prompt_count,
        "template_count": template_count,
        "export_count": export_count,
        "generated_content_count": generated_content_count,
        "user_memory_enabled": user_memory_enabled,
        "embeddings_active": embeddings_active,
        "avg_response_time": round(avg_response_time, 2),
        "prompt_effectiveness": round(avg_prompt_effectiveness, 2),
        "user_engagement": round(avg_user_engagement, 2)
    }

@router.get("/analytics/export")
def export_analytics(
    format: str,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    analytics_entries = db.query(models.Analytics).filter(
        models.Analytics.owner_id == current_user.id
    ).all()

    if format == "csv":
        return _export_analytics_csv(analytics_entries)
    elif format == "pdf":
        return _export_analytics_pdf(analytics_entries)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv or pdf.")

def _export_analytics_csv(analytics_entries):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Event Type", "Details", "Timestamp"])
    for entry in analytics_entries:
        writer.writerow([entry.id, entry.event_type, entry.details, entry.timestamp])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=analytics.csv"}
    )

def _export_analytics_pdf(analytics_entries):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Analytics Export", ln=True, align='C')
    pdf.ln(10)

    for entry in analytics_entries:
        pdf.multi_cell(0, 10, f"ID: {entry.id} | Type: {entry.event_type} | Time: {entry.timestamp}\nDetails: {entry.details}\n", border=0)
        pdf.ln(2)

    pdf_bytes = pdf.output(dest="S").encode("latin1")
    pdf_output = BytesIO(pdf_bytes)
    pdf_output.seek(0)

    return StreamingResponse(
        pdf_output,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=analytics.pdf"}
    )
