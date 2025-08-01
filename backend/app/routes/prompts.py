from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, dependencies

router = APIRouter()

@router.post("/prompts/", response_model=schemas.PromptOut)
def create_prompt(prompt: schemas.PromptCreate, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_prompt = models.Prompt(**prompt.dict(), owner_id=current_user.id)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.get("/prompts/", response_model=list[schemas.PromptOut])
def list_prompts(db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.Prompt).filter(models.Prompt.owner_id == current_user.id).all()

@router.put("/prompts/{prompt_id}", response_model=schemas.PromptOut)
def update_prompt(prompt_id: int, prompt_update: schemas.PromptCreate, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id, models.Prompt.owner_id == current_user.id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db_prompt.text = prompt_update.text
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id, models.Prompt.owner_id == current_user.id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(db_prompt)
    db.commit()
    return {"detail": "Prompt deleted successfully"}
