from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, dependencies
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(
    prefix="/chat",
    tags=["Chat History"]
)

class ChatMessage(BaseModel):
    id: int
    session_id: str
    prompt: str
    response: str
    timestamp: datetime

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatSession(BaseModel):
    session_id: str
    first_prompt: str
    last_updated: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

@router.get("/sessions/", response_model=List[ChatSession])
def get_sessions(
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    sessions = (
        db.query(
            models.ChatHistory.session_id,
            func.min(models.ChatHistory.timestamp).label("first_timestamp"),
            func.min(models.ChatHistory.prompt).label("first_prompt")
        )
        .filter(models.ChatHistory.owner_id == current_user.id)
        .group_by(models.ChatHistory.session_id)
        .order_by(func.max(models.ChatHistory.timestamp).desc())
        .all()
    )
    return [
        {
            "session_id": s.session_id,
            "first_prompt": s.first_prompt,
            "last_updated": s.first_timestamp
        }
        for s in sessions
    ]

@router.get("/session/{session_id}", response_model=List[ChatMessage])
def get_session_history(
    session_id: str,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    messages = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.owner_id == current_user.id,
                models.ChatHistory.session_id == session_id)
        .order_by(models.ChatHistory.timestamp.asc())
        .all()
    )
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found or no messages.")
    return messages

@router.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(dependencies.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    messages = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.owner_id == current_user.id,
                models.ChatHistory.session_id == session_id)
        .all()
    )
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found.")

    for message in messages:
        db.delete(message)
    db.commit()
    return {"detail": "Session deleted successfully."}
