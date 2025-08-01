from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import List, Optional

# ==========================
# User Schemas
# ==========================
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "Viewer"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    email: Optional[EmailStr] = None
    profile_pic_url: Optional[str] = None  # URL or file path

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    profile_pic_url: Optional[str] = None

# ==========================
# Template Schemas
# ==========================
class TemplateBase(BaseModel):
    name: str
    prompt_text: str

class TemplateCreate(TemplateBase):
    pass

class TemplateOut(TemplateBase):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)

# ==========================
# Prompt Schemas
# ==========================
class PromptBase(BaseModel):
    text: str

class PromptCreate(PromptBase):
    pass

class PromptOut(PromptBase):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)

# ==========================
# Export Schemas
# ==========================
class ExportPrompt(BaseModel):
    id: int
    text: str

class ExportTemplate(BaseModel):
    id: int
    name: str
    prompt_text: str

# ==========================
# Analytics Schemas
# ==========================
class AnalyticsOut(BaseModel):
    prompt_count: int
    template_count: int

# ==========================
# Generated Content Schemas
# ==========================
class GeneratedContentCreate(BaseModel):
    text: str
    model_used: str  # Example: "mistral (LM Studio)"
    created_at: datetime

class GeneratedContentOut(GeneratedContentCreate):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)

# ==========================
# Memory FAISS Schemas
# ==========================
class AddMemoryRequest(BaseModel):
    text: str

class SearchMemoryRequest(BaseModel):
    query: str
    k: int = 3

class AddMemoryResponse(BaseModel):
    message: str
    faiss_id: int

class Match(BaseModel):
    faiss_id: int
    text: str
    distance: float

class SearchResponse(BaseModel):
    matches: List[Match]
