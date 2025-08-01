from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, dependencies

router = APIRouter()

@router.post("/templates/", response_model=schemas.TemplateOut)
def create_template(
    template: schemas.TemplateCreate,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.require_role("Admin", "Editor", "Creator"))  # Allow only these roles to create
):
    db_template = models.Template(**template.dict(), owner_id=current_user.id)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates/", response_model=list[schemas.TemplateOut])
def list_templates(
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)  # Any authenticated user can view their templates
):
    return db.query(models.Template).filter(models.Template.owner_id == current_user.id).all()

@router.put("/templates/{template_id}", response_model=schemas.TemplateOut)
def update_template(
    template_id: int,
    template_update: schemas.TemplateCreate,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.require_role("Admin", "Editor"))  # Example: only Admin/Editor can update
):
    db_template = db.query(models.Template).filter(
        models.Template.id == template_id,
        models.Template.owner_id == current_user.id
    ).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db_template.name = template_update.name
    db_template.prompt_text = template_update.prompt_text

    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.require_role("Admin"))  # Only Admins can delete
):
    db_template = db.query(models.Template).filter(
        models.Template.id == template_id,
        models.Template.owner_id == current_user.id
    ).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(db_template)
    db.commit()
    return {"detail": "Template deleted successfully"}
