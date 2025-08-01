from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app import models, schemas, auth, dependencies

router = APIRouter()

@router.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(dependencies.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ Return token same as login
    access_token = auth.create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(dependencies.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/protected")
def protected_route(current_user: models.User = Depends(dependencies.get_current_user)):
    return {"username": current_user.username, "role": current_user.role}

@router.get("/admin-only")
def admin_only(current_user: models.User = Depends(dependencies.require_role("Admin"))):
    return {"message": f"Hello Admin {current_user.username}, you can manage the system!"}

@router.get("/editor-only")
def editor_only(current_user: models.User = Depends(dependencies.require_role("Editor", "Admin"))):
    return {"message": f"Hello {current_user.role} {current_user.username}, you can edit content!"}

@router.get("/viewer-only")
def viewer_only(current_user: models.User = Depends(dependencies.require_role("Viewer", "Editor", "Admin"))):
    return {"message": f"Hello {current_user.role} {current_user.username}, you can view content!"}
