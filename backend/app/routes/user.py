from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import UserOut
import os
import shutil

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Return full user profile including profile_pic_url for frontend to display the image.
    """
    return UserOut.model_validate(current_user)

@router.put("/update", response_model=UserOut)
def update_my_profile(
    email: str = Form(None),
    bio: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if email:
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="Invalid email address")
        current_user.email = email.strip()

    if bio:
        current_user.bio = bio.strip()

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)

@router.post("/upload-profile-pic", response_model=UserOut)
async def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_dir = "static/profile_pics"
    os.makedirs(upload_dir, exist_ok=True)

    # Use clean filename
    ext = os.path.splitext(file.filename)[-1]
    filename = f"{current_user.id}_profile{ext}"
    file_location = os.path.join(upload_dir, filename)

    # Save file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update URL
    current_user.profile_pic_url = f"/static/profile_pics/{filename}"

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
